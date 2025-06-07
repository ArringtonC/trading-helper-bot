# Dynamic Size-Throttle Rule Engine – Rule Schema

## Overview
This document defines the JSON schema for the dynamic position sizing rule engine. The schema is designed to be flexible and extensible, supporting multiple rule types (e.g., throttle, milestone), complex conditions (AND/OR), a variety of operators and actions, and rich metadata for versioning and documentation.

---

## Core Schema Structure
```jsonc
{
  "id": "string",                // Unique rule identifier
  "name": "string",              // Human-readable rule name
  "description": "string",       // Description of the rule's purpose
  "type": "string",              // Rule type: 'throttle', 'milestone', etc.
  "enabled": true,                // Whether the rule is active
  "conditions": {                 // Condition or compound conditions
    // See 'Condition Logic' below
  },
  "actions": [                   // List of actions to perform if conditions are met
    // See 'Supported Actions' below
  ],
  "metadata": {                  // Additional info (version, createdBy, etc.)
    "version": "1.0.0",
    "createdBy": "user@example.com",
    "createdAt": "2024-06-01T12:00:00Z"
  }
}
```

---

## Condition Logic
Conditions can be simple or compound (AND/OR). Each condition has a `field`, `operator`, and `value`.

### Simple Condition
```jsonc
{
  "field": "consecutiveLosses",
  "operator": ">=",
  "value": 2
}
```

### Compound Condition (AND/OR)
```jsonc
{
  "and": [
    { "field": "consecutiveLosses", "operator": ">=", "value": 2 },
    { "field": "accountDrawdown", "operator": ">", "value": 10 }
  ]
}

{
  "or": [
    { "field": "accountGrowth", "operator": ">=", "value": 20 },
    { "field": "milestoneReached", "operator": "==", "value": true }
  ]
}
```

---

## Supported Operators
- `==`, `!=`, `>`, `<`, `>=`, `<=`
- `in`, `not in` (for arrays/enums)

---

## Supported Actions
Each action specifies what to do if the rule triggers.
```jsonc
{
  "type": "reducePositionSize",   // Action type
  "parameters": {
    "byPercent": 50                // Reduce position size by 50%
  }
}

{
  "type": "setPositionSize",
  "parameters": {
    "toPercent": 1                 // Set position size to 1% of account
  }
}

{
  "type": "notify",
  "parameters": {
    "message": "Milestone reached!"
  }
}
```

---

## Metadata Fields
- `version`: Schema or rule version
- `createdBy`: User or system that created the rule
- `createdAt`: ISO timestamp
- (Extensible for audit, tags, etc.)

---

## Example: Two-Loss Throttle Rule
```jsonc
{
  "id": "rule-throttle-2loss",
  "name": "Two-Loss Throttle",
  "description": "Reduce position size by 50% after 2 consecutive losses.",
  "type": "throttle",
  "enabled": true,
  "conditions": {
    "field": "consecutiveLosses",
    "operator": ">=",
    "value": 2
  },
  "actions": [
    {
      "type": "reducePositionSize",
      "parameters": { "byPercent": 50 }
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "createdBy": "trader@domain.com",
    "createdAt": "2024-06-01T12:00:00Z"
  }
}
```

---

## Example: Milestone-Based Rule
```jsonc
{
  "id": "rule-milestone-growth",
  "name": "Growth Milestone",
  "description": "Increase position size to 2% after 20% account growth.",
  "type": "milestone",
  "enabled": true,
  "conditions": {
    "field": "accountGrowth",
    "operator": ">=",
    "value": 20
  },
  "actions": [
    {
      "type": "setPositionSize",
      "parameters": { "toPercent": 2 }
    },
    {
      "type": "notify",
      "parameters": { "message": "Account growth milestone reached!" }
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "createdBy": "trader@domain.com",
    "createdAt": "2024-06-01T12:00:00Z"
  }
}
```

---

## Extensibility
- Add new rule types by extending the `type` field and supporting new condition/action logic.
- Add new actions or operators as needed.
- Compound conditions can be nested for complex logic.

---

## Notes
- All fields are required unless otherwise specified.
- Schema can be implemented as a TypeScript interface for type safety.
- See [src/types/RuleSchema.ts] for a TypeScript version (if implemented). 