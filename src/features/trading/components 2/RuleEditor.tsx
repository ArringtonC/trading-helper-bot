import React, { useState, useEffect } from 'react';
import { Rule, Condition, SimpleCondition, CompoundCondition, Operator } from '../types/RuleSchema';
import ActionParameterEditor from './RuleEditor/ActionParameterEditor';
import { IBKRAPIConfigPanel } from '../../../shared/components/ui/IBKRAPIConfigPanel';
import { IBKRConnectionStatusIndicator } from '../../../shared/components/ui/IBKRConnectionStatusIndicator';
import { useIBKRAPIConfig } from '../../../shared/hooks/useIBKRAPIConfig';

// Minimal initial rule for editing
const defaultRule: Rule = {
  id: '',
  name: '',
  description: '',
  type: 'throttle',
  enabled: true,
  conditions: { and: [{ field: '', operator: '==', value: '' }] }, // Default to AND with one simple condition
  actions: [],
  metadata: { version: '1.0', createdBy: '', createdAt: new Date().toISOString() },
};

const RuleEditor: React.FC<{ initialRule?: Rule, onChange?: (rule: Rule) => void }> = ({ initialRule, onChange }) => {
  const [rule, setRule] = useState<Rule>(initialRule || defaultRule);
  const [showAPIConfig, setShowAPIConfig] = useState(false);

  // IBKR API Configuration hook
  const {
    config: apiConfig,
    updateConfig: setApiConfig,
    metrics: apiMetrics,
    connectionState,
    testConnection,
    resetEmergencyStop,
    resetCircuitBreaker,
    clearQueue
  } = useIBKRAPIConfig();

  // Effect to ensure conditions are always compound for UI management
  useEffect(() => {
    let conditionsModified = false;
    let newConditions: CompoundCondition = { and: [{ field: '', operator: '==', value: '' }] }; // Default structure

    if (rule.conditions) {
      if ('and' in rule.conditions && rule.conditions.and) {
        newConditions = { and: rule.conditions.and.map(c => ('field' in c ? c : { field: '', operator: '==', value: '' }) as SimpleCondition) };
      } else if ('or' in rule.conditions && rule.conditions.or) {
        newConditions = { or: rule.conditions.or.map(c => ('field' in c ? c : { field: '', operator: '==', value: '' }) as SimpleCondition) };
      } else if ('field' in rule.conditions) { // It's a SimpleCondition
        newConditions = { and: [rule.conditions as SimpleCondition] };
        conditionsModified = true;
      } else { // Unknown structure or empty, ensure it's a valid compound
        conditionsModified = true; // Force update to default structure
      }
    } else { // conditions is undefined
      conditionsModified = true; // Force update to default structure
    }
    
    // Check if the structure actually changed to avoid infinite loops
    const currentIsAnd = 'and' in rule.conditions;
    const newIsAnd = 'and' in newConditions;
    const currentConditionsList = currentIsAnd ? (rule.conditions as CompoundCondition).and : (rule.conditions as CompoundCondition).or;
    const newConditionsList = newIsAnd ? newConditions.and : newConditions.or;

    if (conditionsModified || currentIsAnd !== newIsAnd || JSON.stringify(currentConditionsList) !== JSON.stringify(newConditionsList)) {
      setRule(prevRule => ({
        ...prevRule,
        conditions: newConditions
      }));
    }
  }, [rule.conditions]); // Only re-run if rule.conditions object reference changes

  // Handlers for top-level fields
  const handleFieldChange = (field: keyof Rule, value: any) => {
    const updatedRule = { ...rule, [field]: value };
    setRule(updatedRule);
    onChange?.(updatedRule);
  };

  // Handlers for conditions
  const handleConditionTypeChange = (type: 'and' | 'or') => {
    const currentSimpleConditionsList: SimpleCondition[] = ('and' in rule.conditions && rule.conditions.and) 
      ? rule.conditions.and.filter(c => 'field' in c) as SimpleCondition[]
      : ('or' in rule.conditions && rule.conditions.or) 
        ? rule.conditions.or.filter(c => 'field' in c) as SimpleCondition[]
        : [{ field: '', operator: '==', value: '' }];
    
    const updatedConditions: CompoundCondition = type === 'and' ? { and: currentSimpleConditionsList } : { or: currentSimpleConditionsList };
    const updatedRule = { ...rule, conditions: updatedConditions };
    setRule(updatedRule);
    onChange?.(updatedRule);
  };

  const handleSimpleConditionChange = (index: number, field: keyof SimpleCondition, value: any) => {
    let newConditionsList: SimpleCondition[] = [];
    if ('and' in rule.conditions && rule.conditions.and) {
      newConditionsList = rule.conditions.and.map((c, i) => 
        i === index && 'field' in c ? { ...(c as SimpleCondition), [field]: value } : (c as SimpleCondition) // Ensure we are working with SimpleCondition
      );
      const updatedRule = { ...rule, conditions: { and: newConditionsList } };
      setRule(updatedRule);
      onChange?.(updatedRule);
    } else if ('or' in rule.conditions && rule.conditions.or) {
      newConditionsList = rule.conditions.or.map((c, i) => 
        i === index && 'field' in c ? { ...(c as SimpleCondition), [field]: value } : (c as SimpleCondition) // Ensure we are working with SimpleCondition
      );
      const updatedRule = { ...rule, conditions: { or: newConditionsList } };
      setRule(updatedRule);
      onChange?.(updatedRule);
    }
  };

  const addSimpleCondition = () => {
    const newCondition: SimpleCondition = { field: '', operator: '==', value: '' };
    if ('and' in rule.conditions && rule.conditions.and) {
      const updatedConditionsList = [...rule.conditions.and, newCondition] as Condition[];
      const updatedRule = { ...rule, conditions: { and: updatedConditionsList } };
      setRule(updatedRule);
      onChange?.(updatedRule);
    } else if ('or' in rule.conditions && rule.conditions.or) {
      const updatedConditionsList = [...rule.conditions.or, newCondition] as Condition[];
      const updatedRule = { ...rule, conditions: { or: updatedConditionsList } };
      setRule(updatedRule);
      onChange?.(updatedRule);
    } else { 
      const updatedRule = { ...rule, conditions: { and: [newCondition] as Condition[] } }; 
      setRule(updatedRule);
      onChange?.(updatedRule);
    }
  };

  const removeSimpleCondition = (index: number) => {
    if ('and' in rule.conditions && rule.conditions.and) {
      const updatedConditionsList = rule.conditions.and.filter((_, i) => i !== index) as Condition[];
      const updatedRule = { ...rule, conditions: { and: updatedConditionsList.length > 0 ? updatedConditionsList : [{ field: '', operator: '==', value: ''} as SimpleCondition] as Condition[] } };
      setRule(updatedRule);
      onChange?.(updatedRule);
    } else if ('or' in rule.conditions && rule.conditions.or) {
      const updatedConditionsList = rule.conditions.or.filter((_, i) => i !== index) as Condition[];
      const updatedRule = { ...rule, conditions: { or: updatedConditionsList.length > 0 ? updatedConditionsList : [{ field: '', operator: '==', value: ''} as SimpleCondition] as Condition[] } };
      setRule(updatedRule);
      onChange?.(updatedRule);
    }
  };

  // Handlers for actions (add/remove/edit)
  const handleAddAction = () => {
    const updatedRule = { ...rule, actions: [...rule.actions, { type: '', parameters: {} }] };
    setRule(updatedRule);
    onChange?.(updatedRule);
  };
  const handleActionChange = (idx: number, action: any) => {
    const actions = rule.actions.map((a, i) => i === idx ? action : a);
    const updatedRule = { ...rule, actions };
    setRule(updatedRule);
    onChange?.(updatedRule);
  };
  const handleRemoveAction = (idx: number) => {
    const updatedRule = { ...rule, actions: rule.actions.filter((_, i) => i !== idx) };
    setRule(updatedRule);
    onChange?.(updatedRule);
  };

  const currentConditionType = 'and' in rule.conditions ? 'and' : 'or';
  const currentSimpleConditions: SimpleCondition[] = React.useMemo(() => {
    if ('and' in rule.conditions && rule.conditions.and) {
      return rule.conditions.and.filter(c => 'field' in c) as SimpleCondition[];
    } else if ('or' in rule.conditions && rule.conditions.or) {
      return rule.conditions.or.filter(c => 'field' in c) as SimpleCondition[];
    }
    return [{ field: '', operator: '==', value: '' }]; // Fallback, should be caught by useEffect
  }, [rule.conditions]);

  return (
    <div className="space-y-6">
      {/* Main Rule Editor */}
      <div className="card p-3">
        <h3>Rule Editor</h3>
        <div className="mb-2">
          <label>Name</label>
          <input className="form-control" value={rule.name} onChange={e => handleFieldChange('name', e.target.value)} />
        </div>
        <div className="mb-2">
          <label>Description</label>
          <textarea className="form-control" value={rule.description} onChange={e => handleFieldChange('description', e.target.value)} />
        </div>
        <div className="mb-2">
          <label>Type</label>
          <select className="form-select" value={rule.type} onChange={e => handleFieldChange('type', e.target.value)}>
            <option value="throttle">Throttle</option>
            <option value="milestone">Milestone</option>
          </select>
        </div>
        <div className="mb-2">
          <label>Enabled</label>
          <input type="checkbox" checked={rule.enabled} onChange={e => handleFieldChange('enabled', e.target.checked)} />
        </div>
        <div className="card p-2 mb-2">
          <label className="fw-bold">Conditions</label>
          <div className="mb-2">
            <select 
              className="form-select form-select-sm w-auto" 
              value={currentConditionType}
              onChange={e => handleConditionTypeChange(e.target.value as 'and' | 'or')}
            >
              <option value="and">All (AND)</option>
              <option value="or">Any (OR)</option>
            </select>
          </div>

          {currentSimpleConditions.map((condition, index) => (
            <div key={index} className="d-flex gap-2 align-items-center border p-2 mb-2 rounded">
              <input 
                className="form-control" 
                placeholder="Field (e.g., context.trade.symbol)"
                value={(condition as SimpleCondition).field} 
                onChange={e => handleSimpleConditionChange(index, 'field', e.target.value)} 
              />
              <select 
                className="form-select"
                value={(condition as SimpleCondition).operator} 
                onChange={e => handleSimpleConditionChange(index, 'operator', e.target.value as Operator)} 
              >
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
              <input 
                className="form-control" 
                placeholder="Value (e.g., AAPL or 100)"
                value={(condition as SimpleCondition).value} 
                onChange={e => handleSimpleConditionChange(index, 'value', e.target.value)} 
              />
              {currentSimpleConditions.length > 1 && (
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeSimpleCondition(index)}
                  title="Remove condition"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-outline-primary btn-sm mt-1" onClick={addSimpleCondition}>+ Add Condition</button>
        </div>
        <div className="mb-2">
          <label>Actions</label>
          {rule.actions.map((action, idx) => (
            <div key={idx} className="border rounded p-3 mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Action {idx + 1}</h6>
                <button 
                  className="btn btn-outline-danger btn-sm" 
                  onClick={() => handleRemoveAction(idx)}
                  title="Remove action"
                >
                  ×
                </button>
              </div>
              <ActionParameterEditor
                action={action}
                onChange={(updatedAction) => handleActionChange(idx, updatedAction)}
              />
            </div>
          ))}
          <button className="btn btn-secondary btn-sm mt-1" onClick={handleAddAction}>Add Action</button>
        </div>
        {/* TODO: Add visualization, validation, drag-and-drop, and advanced UX */}
        <div className="mt-3">
          <h5>Live Rule JSON Preview</h5>
          <pre style={{ background: '#f8f8f8', padding: 8, fontSize: 12 }}>{JSON.stringify(rule, null, 2)}</pre>
        </div>
      </div>

      {/* IBKR API Configuration Section */}
      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h3 className="mb-1">IBKR API Configuration</h3>
            <p className="text-muted small mb-0">Configure API rate limits, retry logic, and fail-safe controls for rule execution</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <IBKRConnectionStatusIndicator 
              connectionStatus={connectionState.status}
              metrics={apiMetrics || undefined}
              refreshInterval={5000}
            />
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowAPIConfig(!showAPIConfig)}
            >
              {showAPIConfig ? 'Hide' : 'Show'} API Config
            </button>
          </div>
        </div>

        {showAPIConfig && (
          <IBKRAPIConfigPanel
            config={apiConfig}
            metrics={apiMetrics || undefined}
            onConfigChange={setApiConfig}
            connectionStatus={connectionState.status}
            onTestConnection={testConnection}
            onResetEmergencyStop={resetEmergencyStop}
            onResetCircuitBreaker={resetCircuitBreaker}
          />
        )}

        {!showAPIConfig && (
          <div className="row">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body p-3">
                  <h6 className="card-title mb-2">Quick Status</h6>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Rate Limit:</span>
                    <span className="badge bg-primary">{apiConfig.maxRequestsPerSecond}/sec</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small">Queue Length:</span>
                    <span className="badge bg-info">{apiMetrics?.queueLength || 0}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="small">Success Rate:</span>
                    <span className="badge bg-success">
                      {apiMetrics ? ((apiMetrics.successfulRequests / apiMetrics.totalRequests) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body p-3">
                  <h6 className="card-title mb-2">Quick Actions</h6>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={testConnection}
                    >
                      Test Connection
                    </button>
                    <button 
                      className="btn btn-outline-warning btn-sm"
                      onClick={clearQueue}
                    >
                      Clear Queue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleEditor; 