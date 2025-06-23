import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RuleEditor from './RuleEditor';
import { Rule, Operator, Condition, SimpleCondition, CompoundCondition } from '../types/RuleSchema';

const mockInitialRule: Rule = {
  id: 'test-rule-1',
  name: 'Test Rule Name',
  description: 'Test Rule Description',
  type: 'throttle',
  enabled: true,
  conditions: {
    and: [
      { field: 'price', operator: '>', value: 100 },
      { field: 'volume', operator: '<', value: 1000 },
    ],
  },
  actions: [
    { type: 'notify', parameters: { message: 'Test notification' } },
  ],
  metadata: {
    version: '1.0',
    createdBy: 'testUser',
    createdAt: new Date().toISOString(),
  },
};

describe('RuleEditor Component', () => {
  test('renders with initial rule and displays basic properties', () => {
    render(<RuleEditor initialRule={mockInitialRule} />);

    expect(screen.getByLabelText(/Name/i)).toHaveValue(mockInitialRule.name);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(mockInitialRule.description);
    expect(screen.getByLabelText(/Type/i)).toHaveValue(mockInitialRule.type);
    expect(screen.getByLabelText(/Enabled/i)).toBeChecked();
  });

  test('calls onChange when a basic rule property is changed (e.g., name)', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'New Rule Name' } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Rule Name' })
      );
    });
  });

  test('changes condition type from AND to OR', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);
    
    expect(screen.getByDisplayValue(/All \(AND\)/i)).toBeInTheDocument();

    const conditionTypeSelect = screen.getByRole('combobox'); 
    fireEvent.change(conditionTypeSelect, { target: { value: 'or' } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      expect(updatedRule.conditions).toBeDefined();
      if (updatedRule.conditions && 'or' in updatedRule.conditions) {
        expect(updatedRule.conditions.or).toBeDefined();
        const mockAndConditions = (mockInitialRule.conditions as CompoundCondition).and;
        expect(updatedRule.conditions.or?.length).toBe(mockAndConditions?.length);
      }
      expect(screen.getByDisplayValue(/Any \(OR\)/i)).toBeInTheDocument();
    });
  });

  test('adds a new simple condition', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);

    let initialConditionsCount = 0;
    if (mockInitialRule.conditions && 'and' in mockInitialRule.conditions && mockInitialRule.conditions.and) {
        initialConditionsCount = mockInitialRule.conditions.and.length;
    }

    const addConditionButton = screen.getByText(/\+ Add Condition/i);
    fireEvent.click(addConditionButton);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      if (updatedRule.conditions && 'and' in updatedRule.conditions && updatedRule.conditions.and) {
        expect(updatedRule.conditions.and.length).toBe(initialConditionsCount + 1);
      }
      const newConditionInputs = screen.getAllByPlaceholderText(/Field \(e.g., context.trade.symbol\)/i);
      expect(newConditionInputs.length).toBe(initialConditionsCount + 1);
    });
  });
  
  test('removes a simple condition', async () => {
    const handleChange = jest.fn();
    // Ensure there are at least two conditions to test removal of one
    const ruleWithMultipleConditions: Rule = {
      ...mockInitialRule,
      conditions: {
        and: [
          { field: 'price', operator: '>', value: 100 },
          { field: 'volume', operator: '<', value: 1000 },
        ],
      },
    };
    render(<RuleEditor initialRule={ruleWithMultipleConditions} onChange={handleChange} />);

    const initialConditionsCount = (ruleWithMultipleConditions.conditions as CompoundCondition).and?.length || 0;
    expect(initialConditionsCount).toBeGreaterThan(1); 

    const removeButtons = screen.getAllByTitle(/Remove condition/i);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      if (updatedRule.conditions && 'and' in updatedRule.conditions && updatedRule.conditions.and) {
         expect(updatedRule.conditions.and.length).toBe(initialConditionsCount - 1);
      }
    });
  });

  test('changes a simple condition field (e.g., field name)', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);
    
    const conditionFieldInputs = screen.getAllByPlaceholderText(/Field \(e.g., context.trade.symbol\)/i);
    fireEvent.change(conditionFieldInputs[0], { target: { value: 'newFieldName' } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      if (updatedRule.conditions && 'and' in updatedRule.conditions && updatedRule.conditions.and && updatedRule.conditions.and[0]) {
        expect((updatedRule.conditions.and[0] as SimpleCondition).field).toBe('newFieldName');
      }
    });
  });

  test('adds a new action', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);

    const initialActionsCount = mockInitialRule.actions.length;
    const addActionButton = screen.getByText(/Add Action/i);
    fireEvent.click(addActionButton);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled(); // RuleEditor internal state for actions might not always trigger top-level onChange immediately
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      expect(updatedRule.actions.length).toBe(initialActionsCount + 1);
      // Check for new action fields (e.g., a select with placeholder)
      expect(screen.getAllByDisplayValue(/Select Action/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  test('removes an action', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);
    
    const initialActionsCount = mockInitialRule.actions.length;
    expect(initialActionsCount).toBeGreaterThan(0);

    const removeActionButtons = screen.getAllByText(/Remove/i).filter(btn => btn.closest('.d-flex.gap-2.align-items-center.mb-1'));
    fireEvent.click(removeActionButtons[0]);

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalled();
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      expect(updatedRule.actions.length).toBe(initialActionsCount - 1);
    });
  });

  test('changes an action type and parameters', async () => {
    const handleChange = jest.fn();
    render(<RuleEditor initialRule={mockInitialRule} onChange={handleChange} />);

    const actionTypeSelects = screen.getAllByDisplayValue(mockInitialRule.actions[0].type);
    fireEvent.change(actionTypeSelects[0], { target: { value: 'log' } });

    // Wait for the type change to propagate if necessary
    await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
    });

    const parameterInputs = screen.getAllByPlaceholderText(/Parameters \(JSON\)/i);
    const newParams = { level: 'info', detail: 'New log detail' };
    fireEvent.change(parameterInputs[0], { target: { value: JSON.stringify(newParams) } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledTimes(2); // Once for type, once for params
      const updatedRule = handleChange.mock.calls[handleChange.mock.calls.length - 1][0] as Rule;
      expect(updatedRule.actions[0].type).toBe('log');
      expect(updatedRule.actions[0].parameters).toEqual(newParams);
    });
  });

  // TODO: Add more tests for edge cases, validation, different operators, etc.
}); 