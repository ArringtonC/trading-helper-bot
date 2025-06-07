var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useState, useEffect } from 'react';
// Minimal initial rule for editing
var defaultRule = {
    id: '',
    name: '',
    description: '',
    type: 'throttle',
    enabled: true,
    conditions: { and: [{ field: '', operator: '==', value: '' }] }, // Default to AND with one simple condition
    actions: [],
    metadata: { version: '1.0', createdBy: '', createdAt: new Date().toISOString() },
};
var RuleEditor = function (_a) {
    var initialRule = _a.initialRule, onChange = _a.onChange;
    var _b = useState(initialRule || defaultRule), rule = _b[0], setRule = _b[1];
    // Effect to ensure conditions are always compound for UI management
    useEffect(function () {
        var conditionsModified = false;
        var newConditions = { and: [{ field: '', operator: '==', value: '' }] }; // Default structure
        if (rule.conditions) {
            if ('and' in rule.conditions && rule.conditions.and) {
                newConditions = { and: rule.conditions.and.map(function (c) { return ('field' in c ? c : { field: '', operator: '==', value: '' }); }) };
            }
            else if ('or' in rule.conditions && rule.conditions.or) {
                newConditions = { or: rule.conditions.or.map(function (c) { return ('field' in c ? c : { field: '', operator: '==', value: '' }); }) };
            }
            else if ('field' in rule.conditions) { // It's a SimpleCondition
                newConditions = { and: [rule.conditions] };
                conditionsModified = true;
            }
            else { // Unknown structure or empty, ensure it's a valid compound
                conditionsModified = true; // Force update to default structure
            }
        }
        else { // conditions is undefined
            conditionsModified = true; // Force update to default structure
        }
        // Check if the structure actually changed to avoid infinite loops
        var currentIsAnd = 'and' in rule.conditions;
        var newIsAnd = 'and' in newConditions;
        var currentConditionsList = currentIsAnd ? rule.conditions.and : rule.conditions.or;
        var newConditionsList = newIsAnd ? newConditions.and : newConditions.or;
        if (conditionsModified || currentIsAnd !== newIsAnd || JSON.stringify(currentConditionsList) !== JSON.stringify(newConditionsList)) {
            setRule(function (prevRule) { return (__assign(__assign({}, prevRule), { conditions: newConditions })); });
        }
    }, [rule.conditions]); // Only re-run if rule.conditions object reference changes
    // Handlers for top-level fields
    var handleFieldChange = function (field, value) {
        var _a;
        var updatedRule = __assign(__assign({}, rule), (_a = {}, _a[field] = value, _a));
        setRule(updatedRule);
        onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
    };
    // Handlers for conditions
    var handleConditionTypeChange = function (type) {
        var currentSimpleConditionsList = ('and' in rule.conditions && rule.conditions.and)
            ? rule.conditions.and.filter(function (c) { return 'field' in c; })
            : ('or' in rule.conditions && rule.conditions.or)
                ? rule.conditions.or.filter(function (c) { return 'field' in c; })
                : [{ field: '', operator: '==', value: '' }];
        var updatedConditions = type === 'and' ? { and: currentSimpleConditionsList } : { or: currentSimpleConditionsList };
        var updatedRule = __assign(__assign({}, rule), { conditions: updatedConditions });
        setRule(updatedRule);
        onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
    };
    var handleSimpleConditionChange = function (index, field, value) {
        var newConditionsList = [];
        if ('and' in rule.conditions && rule.conditions.and) {
            newConditionsList = rule.conditions.and.map(function (c, i) {
                var _a;
                return i === index && 'field' in c ? __assign(__assign({}, c), (_a = {}, _a[field] = value, _a)) : c;
            } // Ensure we are working with SimpleCondition
            );
            var updatedRule = __assign(__assign({}, rule), { conditions: { and: newConditionsList } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
        else if ('or' in rule.conditions && rule.conditions.or) {
            newConditionsList = rule.conditions.or.map(function (c, i) {
                var _a;
                return i === index && 'field' in c ? __assign(__assign({}, c), (_a = {}, _a[field] = value, _a)) : c;
            } // Ensure we are working with SimpleCondition
            );
            var updatedRule = __assign(__assign({}, rule), { conditions: { or: newConditionsList } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
    };
    var addSimpleCondition = function () {
        var newCondition = { field: '', operator: '==', value: '' };
        if ('and' in rule.conditions && rule.conditions.and) {
            var updatedConditionsList = __spreadArray(__spreadArray([], rule.conditions.and, true), [newCondition], false);
            var updatedRule = __assign(__assign({}, rule), { conditions: { and: updatedConditionsList } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
        else if ('or' in rule.conditions && rule.conditions.or) {
            var updatedConditionsList = __spreadArray(__spreadArray([], rule.conditions.or, true), [newCondition], false);
            var updatedRule = __assign(__assign({}, rule), { conditions: { or: updatedConditionsList } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
        else {
            var updatedRule = __assign(__assign({}, rule), { conditions: { and: [newCondition] } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
    };
    var removeSimpleCondition = function (index) {
        if ('and' in rule.conditions && rule.conditions.and) {
            var updatedConditionsList = rule.conditions.and.filter(function (_, i) { return i !== index; });
            var updatedRule = __assign(__assign({}, rule), { conditions: { and: updatedConditionsList.length > 0 ? updatedConditionsList : [{ field: '', operator: '==', value: '' }] } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
        else if ('or' in rule.conditions && rule.conditions.or) {
            var updatedConditionsList = rule.conditions.or.filter(function (_, i) { return i !== index; });
            var updatedRule = __assign(__assign({}, rule), { conditions: { or: updatedConditionsList.length > 0 ? updatedConditionsList : [{ field: '', operator: '==', value: '' }] } });
            setRule(updatedRule);
            onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
        }
    };
    // Handlers for actions (add/remove/edit)
    var handleAddAction = function () {
        setRule(__assign(__assign({}, rule), { actions: __spreadArray(__spreadArray([], rule.actions, true), [{ type: '', parameters: {} }], false) }));
    };
    var handleActionChange = function (idx, field, value) {
        var actions = rule.actions.map(function (a, i) {
            var _a;
            return i === idx ? __assign(__assign({}, a), (_a = {}, _a[field] = value, _a)) : a;
        });
        setRule(__assign(__assign({}, rule), { actions: actions }));
    };
    var handleRemoveAction = function (idx) {
        var updatedRule = __assign(__assign({}, rule), { actions: rule.actions.filter(function (_, i) { return i !== idx; }) });
        setRule(updatedRule);
        onChange === null || onChange === void 0 ? void 0 : onChange(updatedRule);
    };
    var currentConditionType = 'and' in rule.conditions ? 'and' : 'or';
    var currentSimpleConditions = React.useMemo(function () {
        if ('and' in rule.conditions && rule.conditions.and) {
            return rule.conditions.and.filter(function (c) { return 'field' in c; });
        }
        else if ('or' in rule.conditions && rule.conditions.or) {
            return rule.conditions.or.filter(function (c) { return 'field' in c; });
        }
        return [{ field: '', operator: '==', value: '' }]; // Fallback, should be caught by useEffect
    }, [rule.conditions]);
    return (<div className="card p-3">
      <h3>Rule Editor</h3>
      <div className="mb-2">
        <label>Name</label>
        <input className="form-control" value={rule.name} onChange={function (e) { return handleFieldChange('name', e.target.value); }}/>
      </div>
      <div className="mb-2">
        <label>Description</label>
        <textarea className="form-control" value={rule.description} onChange={function (e) { return handleFieldChange('description', e.target.value); }}/>
      </div>
      <div className="mb-2">
        <label>Type</label>
        <select className="form-select" value={rule.type} onChange={function (e) { return handleFieldChange('type', e.target.value); }}>
          <option value="throttle">Throttle</option>
          <option value="milestone">Milestone</option>
        </select>
      </div>
      <div className="mb-2">
        <label>Enabled</label>
        <input type="checkbox" checked={rule.enabled} onChange={function (e) { return handleFieldChange('enabled', e.target.checked); }}/>
      </div>
      <div className="card p-2 mb-2">
        <label className="fw-bold">Conditions</label>
        <div className="mb-2">
          <select className="form-select form-select-sm w-auto" value={currentConditionType} onChange={function (e) { return handleConditionTypeChange(e.target.value); }}>
            <option value="and">All (AND)</option>
            <option value="or">Any (OR)</option>
          </select>
        </div>

        {currentSimpleConditions.map(function (condition, index) { return (<div key={index} className="d-flex gap-2 align-items-center border p-2 mb-2 rounded">
            <input className="form-control" placeholder="Field (e.g., context.trade.symbol)" value={condition.field} onChange={function (e) { return handleSimpleConditionChange(index, 'field', e.target.value); }}/>
            <select className="form-select" value={condition.operator} onChange={function (e) { return handleSimpleConditionChange(index, 'operator', e.target.value); }}>
              <option value="==">== (Equals)</option>
              <option value=">">&gt; (Greater than)</option>
              <option value="<">&lt; (Less than)</option>
              <option value=">=">&gt;= (Greater or equal)</option>
              <option value="<=">&lt;= (Less or equal)</option>
              <option value="!=">!= (Not equals)</option>
              <option value="in">in (Is in list, comma-separated)</option>
              <option value="not in">not in (Not in list, comma-separated)</option>
              <option value="contains">contains (String contains)</option>
              <option value="startsWith">startsWith (String starts with)</option>
              <option value="matches">matches (Regex match)</option>
            </select>
            <input className="form-control" placeholder="Value (e.g., AAPL or 100)" value={condition.value} onChange={function (e) { return handleSimpleConditionChange(index, 'value', e.target.value); }}/>
            {currentSimpleConditions.length > 1 && (<button className="btn btn-outline-danger btn-sm" onClick={function () { return removeSimpleCondition(index); }} title="Remove condition">
                &times;
              </button>)}
          </div>); })}
        <button className="btn btn-outline-primary btn-sm mt-1" onClick={addSimpleCondition}>+ Add Condition</button>
      </div>
      <div className="mb-2">
        <label>Actions</label>
        {rule.actions.map(function (action, idx) { return (<div key={idx} className="d-flex gap-2 align-items-center mb-1">
            <select className="form-select" value={action.type} onChange={function (e) { return handleActionChange(idx, 'type', e.target.value); }}>
              <option value="">Select Action</option>
              <option value="reducePositionSize">Reduce Position Size</option>
              <option value="setPositionSize">Set Position Size</option>
              <option value="notify">Notify</option>
              <option value="log">Log</option>
              <option value="alert">Alert</option>
            </select>
            <input className="form-control" placeholder="Parameters (JSON)" value={JSON.stringify(action.parameters)} onChange={function (e) {
                try {
                    handleActionChange(idx, 'parameters', JSON.parse(e.target.value));
                }
                catch (_a) {
                    // Ignore parse errors for now
                }
            }}/>
            <button className="btn btn-danger btn-sm" onClick={function () { return handleRemoveAction(idx); }}>Remove</button>
          </div>); })}
        <button className="btn btn-secondary btn-sm mt-1" onClick={handleAddAction}>Add Action</button>
      </div>
      {/* TODO: Add visualization, validation, drag-and-drop, and advanced UX */}
      <div className="mt-3">
        <h5>Live Rule JSON Preview</h5>
        <pre style={{ background: '#f8f8f8', padding: 8, fontSize: 12 }}>{JSON.stringify(rule, null, 2)}</pre>
      </div>
    </div>);
};
export default RuleEditor;
