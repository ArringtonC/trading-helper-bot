import React, { useState, useEffect, useMemo } from 'react';
import { Action } from '../../../../shared/types/RuleSchema';
import { 
  ActionParameterValidator, 
  ValidationError, 
  ValidationResult 
} from '../../../../utils/validation/actionParameterValidator';
import { 
  getActionParameterSchema, 
  getAvailableActionTypes, 
  getActionTypeDescription 
} from '../../../../utils/validation/actionParameterSchemas';

interface ActionParameterEditorProps {
  action: Action;
  onChange: (action: Action) => void;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
}

interface FieldEditorProps {
  fieldName: string;
  fieldValue: any;
  fieldSchema: any;
  onChange: (value: any) => void;
  error?: ValidationError;
  warning?: ValidationError;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ 
  fieldName, 
  fieldValue, 
  fieldSchema, 
  onChange, 
  error, 
  warning 
}) => {
  const [localValue, setLocalValue] = useState(fieldValue);

  useEffect(() => {
    setLocalValue(fieldValue);
  }, [fieldValue]);

  const handleChange = (value: any) => {
    setLocalValue(value);
    onChange(value);
  };

  const renderInput = () => {
    const baseClasses = `form-control ${error ? 'is-invalid' : warning ? 'is-warning' : ''}`;
    
    switch (fieldSchema.type) {
      case 'string':
        if (fieldSchema.enum) {
          return (
            <select 
              className={`form-select ${error ? 'is-invalid' : warning ? 'is-warning' : ''}`}
              value={localValue || ''}
              onChange={(e) => handleChange(e.target.value)}
            >
              <option value="">Select {fieldName}</option>
              {fieldSchema.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        
        if (fieldSchema.format === 'uri') {
          return (
            <input
              type="url"
              className={baseClasses}
              value={localValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Enter ${fieldName} URL`}
            />
          );
        }
        
        return (
          <input
            type="text"
            className={baseClasses}
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${fieldName}`}
            minLength={fieldSchema.minLength}
            maxLength={fieldSchema.maxLength}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            className={baseClasses}
            value={localValue || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${fieldName}`}
            min={fieldSchema.minimum}
            max={fieldSchema.maximum}
            step={fieldSchema.type === 'integer' ? 1 : 0.01}
          />
        );

      case 'boolean':
        return (
          <div className="form-check">
            <input
              type="checkbox"
              className={`form-check-input ${error ? 'is-invalid' : ''}`}
              checked={localValue || false}
              onChange={(e) => handleChange(e.target.checked)}
            />
            <label className="form-check-label">
              {fieldSchema.description || fieldName}
            </label>
          </div>
        );

      case 'array':
        const arrayValue = Array.isArray(localValue) ? localValue : [];
        return (
          <div className="array-editor">
            {arrayValue.map((item: any, index: number) => (
              <div key={index} className="d-flex gap-2 mb-2">
                <FieldEditor
                  fieldName={`${fieldName}[${index}]`}
                  fieldValue={item}
                  fieldSchema={fieldSchema.items || { type: 'string' }}
                  onChange={(value) => {
                    const newArray = [...arrayValue];
                    newArray[index] = value;
                    handleChange(newArray);
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    const newArray = arrayValue.filter((_, i) => i !== index);
                    handleChange(newArray);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => {
                const newArray = [...arrayValue, ''];
                handleChange(newArray);
              }}
            >
              + Add {fieldName}
            </button>
          </div>
        );

      case 'object':
        return (
          <div className="object-editor border rounded p-2">
            <textarea
              className={baseClasses}
              value={JSON.stringify(localValue || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange(parsed);
                } catch {
                  // Keep the text value for editing
                }
              }}
              placeholder={`Enter ${fieldName} as JSON`}
              rows={4}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            className={baseClasses}
            value={typeof localValue === 'string' ? localValue : JSON.stringify(localValue || '')}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch {
                handleChange(e.target.value);
              }
            }}
            placeholder={`Enter ${fieldName}`}
          />
        );
    }
  };

  return (
    <div className="mb-3">
      <label className="form-label">
        {fieldName}
        {fieldSchema.description && (
          <small className="text-muted ms-2">({fieldSchema.description})</small>
        )}
      </label>
      {renderInput()}
      {error && (
        <div className="invalid-feedback d-block">
          {error.message}
        </div>
      )}
      {warning && !error && (
        <div className="text-warning small">
          ⚠️ {warning.message}
        </div>
      )}
    </div>
  );
};

const ActionParameterEditor: React.FC<ActionParameterEditorProps> = ({
  action,
  onChange,
  onValidationChange
}) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const schema = useMemo(() => {
    return getActionParameterSchema(action.type);
  }, [action.type]);

  const availableActionTypes = useMemo(() => {
    return getAvailableActionTypes();
  }, []);

  // Validate parameters whenever they change
  useEffect(() => {
    if (action.type) {
      const result = ActionParameterValidator.validate(action.type, action.parameters);
      setValidation(result);
      onValidationChange?.(result.isValid, result.errors);
    }
  }, [action.type, action.parameters, onValidationChange]);

  const handleActionTypeChange = (newType: string) => {
    onChange({
      ...action,
      type: newType,
      parameters: {} // Reset parameters when type changes
    });
  };

  const handleParameterChange = (fieldName: string, value: any) => {
    onChange({
      ...action,
      parameters: {
        ...action.parameters,
        [fieldName]: value
      }
    });
  };

  const getFieldError = (fieldName: string): ValidationError | undefined => {
    return validation.errors.find(error => error.field === fieldName);
  };

  const getFieldWarning = (fieldName: string): ValidationError | undefined => {
    return validation.warnings.find(warning => warning.field === fieldName);
  };

  const renderSchemaBasedEditor = () => {
    if (!schema) {
      return (
        <div className="alert alert-warning">
          <strong>Unknown action type:</strong> {action.type}
          <br />
          <small>Using fallback JSON editor</small>
        </div>
      );
    }

    return (
      <div className="schema-based-editor">
        <div className="mb-3">
          <small className="text-muted">{schema.description}</small>
        </div>
        
        {Object.entries(schema.properties).map(([fieldName, fieldSchema]) => (
          <FieldEditor
            key={fieldName}
            fieldName={fieldName}
            fieldValue={action.parameters[fieldName]}
            fieldSchema={fieldSchema}
            onChange={(value) => handleParameterChange(fieldName, value)}
            error={getFieldError(fieldName)}
            warning={getFieldWarning(fieldName)}
          />
        ))}

        {schema.examples && schema.examples.length > 0 && (
          <div className="mt-3">
            <label className="form-label">Examples:</label>
            <div className="examples-container">
              {schema.examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  className="btn btn-outline-secondary btn-sm me-2 mb-2"
                  onClick={() => onChange({ ...action, parameters: example })}
                  title="Click to use this example"
                >
                  Example {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFallbackEditor = () => {
    return (
      <div className="fallback-editor">
        <label className="form-label">Parameters (JSON)</label>
        <textarea
          className={`form-control ${validation.errors.length > 0 ? 'is-invalid' : ''}`}
          value={JSON.stringify(action.parameters, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange({ ...action, parameters: parsed });
            } catch {
              // Keep the invalid JSON for editing
            }
          }}
          placeholder="Enter parameters as JSON"
          rows={6}
        />
      </div>
    );
  };

  return (
    <div className="action-parameter-editor">
      {/* Action Type Selector */}
      <div className="mb-3">
        <label className="form-label">Action Type</label>
        <select
          className="form-select"
          value={action.type}
          onChange={(e) => handleActionTypeChange(e.target.value)}
        >
          <option value="">Select Action Type</option>
          {availableActionTypes.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {action.type && (
          <small className="text-muted">
            {getActionTypeDescription(action.type)}
          </small>
        )}
      </div>

      {/* Parameters Editor */}
      {action.type && (
        <div className="parameters-section">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Parameters</h6>
            <div className="validation-status">
              {validation.isValid ? (
                <span className="badge bg-success">✓ Valid</span>
              ) : (
                <span className="badge bg-danger">
                  {validation.errors.length} Error{validation.errors.length !== 1 ? 's' : ''}
                </span>
              )}
              {validation.warnings.length > 0 && (
                <span className="badge bg-warning ms-1">
                  {validation.warnings.length} Warning{validation.warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {schema ? renderSchemaBasedEditor() : renderFallbackEditor()}

          {/* Validation Messages */}
          {(validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="validation-messages mt-3">
              {validation.errors.map((error, index) => (
                <div key={`error-${index}`} className="alert alert-danger py-2">
                  <strong>{error.field}:</strong> {error.message}
                </div>
              ))}
              {validation.warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="alert alert-warning py-2">
                  <strong>{warning.field}:</strong> {warning.message}
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions && validation.suggestions.length > 0 && (
            <div className="suggestions mt-3">
              <h6>Suggestions:</h6>
              <ul className="list-unstyled">
                {validation.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-muted small">
                    💡 {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionParameterEditor; 
 
 
 