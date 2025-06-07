// src/types/RuleSchema.ts

export type Operator =
  | '=='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'in'
  | 'not in'
  | 'contains'
  | 'startsWith'
  | 'matches';

export interface Action {
  type: string;
  parameters: Record<string, any>;
  executeAt?: Date | number; // Optional: Date object or delay in milliseconds
}

export interface SimpleCondition {
  field: string;
  operator: Operator;
  value: any;
}

export interface CompoundCondition {
  and?: Condition[];
  or?: Condition[];
}

export type Condition = SimpleCondition | CompoundCondition;

export interface RuleMetadata {
  version: string;
  createdBy: string;
  createdAt: string; // ISO Date string
  updatedAt?: string; // Optional ISO Date string
  tags?: string[];    // Optional tags
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: string; // e.g., 'throttle', 'milestone', 'validation', etc.
  enabled: boolean;
  conditions: Condition;
  actions: Action[];
  priority?: 'low' | 'medium' | 'high' | number; // Optional priority
  dependencies?: string[]; // Optional list of rule IDs this rule depends on
  metadata: RuleMetadata;
} 