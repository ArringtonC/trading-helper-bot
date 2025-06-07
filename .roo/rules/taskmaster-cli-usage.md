---
description: Enforce use of `npx task-master` CLI instead of `npx task-master-ai`
globs: *, scripts/**, docs/**, .roo/rules/**
alwaysApply: true
---

- **Always use `npx task-master` for Taskmaster CLI commands**
  - Do **not** use `npx task-master-ai` unless specifically required for MCP/AI integration or legacy reasons
  - Update documentation, scripts, and chat instructions to reference `npx task-master`
  - Example:
    ```bash
    # ✅ DO: Use the standard CLI
    npx task-master show 28

    # ❌ DON'T: Use the AI-specific CLI unless required
    npx task-master-ai show 28
    ```
- **Rationale:**  
  - The standard CLI (`task-master`) is the supported and documented entry point for most workflows
  - Using `task-master-ai` can cause confusion, errors, or invoke the wrong toolchain
- **Migration:**  
  - If you find references to `task-master-ai` in scripts, docs, or chat, replace them with `task-master`
  - Communicate this rule to all contributors 