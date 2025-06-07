import { getActionParameterSchema } from './actionParameterSchemas';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  expectedType?: string;
  constraint?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  suggestions?: string[];
}

export class ActionParameterValidator {
  /**
   * Validates action parameters against their schema
   */
  static validate(actionType: string, parameters: any): ValidationResult {
    const schema = getActionParameterSchema(actionType);
    
    if (!schema) {
      return {
        isValid: false,
        errors: [{
          field: 'actionType',
          message: `Unknown action type: ${actionType}`,
          value: actionType
        }],
        warnings: [],
        suggestions: ['Check available action types or create a custom schema']
      };
    }

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate that parameters is an object
    if (typeof parameters !== 'object' || parameters === null || Array.isArray(parameters)) {
      result.isValid = false;
      result.errors.push({
        field: 'parameters',
        message: 'Parameters must be an object',
        value: parameters,
        expectedType: 'object'
      });
      return result;
    }

    // Check required fields
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in parameters) || parameters[requiredField] === undefined || parameters[requiredField] === null) {
          result.isValid = false;
          result.errors.push({
            field: requiredField,
            message: `Required field '${requiredField}' is missing`,
            constraint: 'required'
          });
        }
      }
    }

    // Validate each parameter
    for (const [fieldName, fieldValue] of Object.entries(parameters)) {
      const fieldSchema = schema.properties[fieldName];
      
      if (!fieldSchema) {
        if (schema.additionalProperties === false) {
          result.warnings.push({
            field: fieldName,
            message: `Unknown field '${fieldName}' - not defined in schema`,
            value: fieldValue
          });
        }
        continue;
      }

      const fieldValidation = this.validateField(fieldName, fieldValue, fieldSchema);
      result.errors.push(...fieldValidation.errors);
      result.warnings.push(...fieldValidation.warnings);
      
      if (fieldValidation.errors.length > 0) {
        result.isValid = false;
      }
    }

    // Add suggestions based on schema
    if (schema.examples && schema.examples.length > 0) {
      result.suggestions = [
        'Example configurations:',
        ...schema.examples.map(example => JSON.stringify(example, null, 2))
      ];
    }

    return result;
  }

  /**
   * Validates a single field against its schema
   */
  private static validateField(fieldName: string, value: any, fieldSchema: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Type validation
    if (fieldSchema.type) {
      const typeValidation = this.validateType(fieldName, value, fieldSchema.type);
      result.errors.push(...typeValidation.errors);
      result.warnings.push(...typeValidation.warnings);
      
      if (typeValidation.errors.length > 0) {
        result.isValid = false;
        return result; // Don't continue if type is wrong
      }
    }

    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      result.isValid = false;
      result.errors.push({
        field: fieldName,
        message: `Value must be one of: ${fieldSchema.enum.join(', ')}`,
        value: value,
        constraint: 'enum'
      });
    }

    // Number constraints
    if (fieldSchema.type === 'number') {
      if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
        result.isValid = false;
        result.errors.push({
          field: fieldName,
          message: `Value must be >= ${fieldSchema.minimum}`,
          value: value,
          constraint: 'minimum'
        });
      }
      
      if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
        result.isValid = false;
        result.errors.push({
          field: fieldName,
          message: `Value must be <= ${fieldSchema.maximum}`,
          value: value,
          constraint: 'maximum'
        });
      }
    }

    // String constraints
    if (fieldSchema.type === 'string') {
      if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
        result.isValid = false;
        result.errors.push({
          field: fieldName,
          message: `String must be at least ${fieldSchema.minLength} characters`,
          value: value,
          constraint: 'minLength'
        });
      }
      
      if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
        result.isValid = false;
        result.errors.push({
          field: fieldName,
          message: `String must be at most ${fieldSchema.maxLength} characters`,
          value: value,
          constraint: 'maxLength'
        });
      }

      // Format validation
      if (fieldSchema.format === 'uri') {
        try {
          new URL(value);
        } catch {
          result.isValid = false;
          result.errors.push({
            field: fieldName,
            message: 'Value must be a valid URL',
            value: value,
            constraint: 'format'
          });
        }
      }
    }

    // Array validation
    if (fieldSchema.type === 'array') {
      if (fieldSchema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemValidation = this.validateField(`${fieldName}[${i}]`, value[i], fieldSchema.items);
          result.errors.push(...itemValidation.errors);
          result.warnings.push(...itemValidation.warnings);
          
          if (itemValidation.errors.length > 0) {
            result.isValid = false;
          }
        }
      }
    }

    // Object validation
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      for (const [propName, propValue] of Object.entries(value)) {
        const propSchema = fieldSchema.properties[propName];
        if (propSchema) {
          const propValidation = this.validateField(`${fieldName}.${propName}`, propValue, propSchema);
          result.errors.push(...propValidation.errors);
          result.warnings.push(...propValidation.warnings);
          
          if (propValidation.errors.length > 0) {
            result.isValid = false;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validates the type of a value
   */
  private static validateType(fieldName: string, value: any, expectedType: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          result.isValid = false;
          result.errors.push({
            field: fieldName,
            message: `Expected string, got ${actualType}`,
            value: value,
            expectedType: 'string'
          });
        }
        break;
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          result.isValid = false;
          result.errors.push({
            field: fieldName,
            message: `Expected number, got ${actualType}`,
            value: value,
            expectedType: 'number'
          });
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          result.isValid = false;
          result.errors.push({
            field: fieldName,
            message: `Expected boolean, got ${actualType}`,
            value: value,
            expectedType: 'boolean'
          });
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          result.isValid = false;
          result.errors.push({
            field: fieldName,
            message: `Expected array, got ${actualType}`,
            value: value,
            expectedType: 'array'
          });
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          result.isValid = false;
          result.errors.push({
            field: fieldName,
            message: `Expected object, got ${actualType}`,
            value: value,
            expectedType: 'object'
          });
        }
        break;
    }

    return result;
  }

  /**
   * Validates parameters and returns user-friendly error messages
   */
  static validateWithFriendlyMessages(actionType: string, parameters: any): {
    isValid: boolean;
    message: string;
    details?: ValidationError[];
  } {
    const validation = this.validate(actionType, parameters);
    
    if (validation.isValid) {
      return {
        isValid: true,
        message: 'Parameters are valid'
      };
    }

    const errorCount = validation.errors.length;
    const warningCount = validation.warnings.length;
    
    let message = `Found ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
    if (warningCount > 0) {
      message += ` and ${warningCount} warning${warningCount !== 1 ? 's' : ''}`;
    }

    return {
      isValid: false,
      message,
      details: [...validation.errors, ...validation.warnings]
    };
  }

  /**
   * Gets validation suggestions for an action type
   */
  static getSuggestions(actionType: string): string[] {
    const schema = getActionParameterSchema(actionType);
    if (!schema) {
      return ['Unknown action type'];
    }

    const suggestions: string[] = [];
    
    if (schema.description) {
      suggestions.push(`Description: ${schema.description}`);
    }

    if (schema.required && schema.required.length > 0) {
      suggestions.push(`Required fields: ${schema.required.join(', ')}`);
    }

    if (schema.examples && schema.examples.length > 0) {
      suggestions.push('Examples:');
      schema.examples.forEach((example, index) => {
        suggestions.push(`${index + 1}. ${JSON.stringify(example)}`);
      });
    }

    return suggestions;
  }
} 
 
 
 