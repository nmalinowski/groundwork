---
name: groundwork-validate
description: Re-run multi-agent verification on current changes. Usage /groundwork:validate
argument-hint: ""
---

# Copilot Command: /validate

- Generated from Claude command file.
- Primary skill: `/validation-loop`.

## Execution Instructions

1. Parse arguments according to `argument-hint` if present.
2. Run the mapped skill workflow and preserve all task/spec constraints.
3. If user confirmation is required, ask directly and wait for response.
4. Preserve structured `RESULT:` output lines when present in skill contracts.

## Source Body (for compatibility)

# Validate Command

Re-run multi-agent verification on current changes without re-executing the task.

Invoke the `groundwork:validation-loop` skill: `Skill(skill="groundwork:validation-loop")`
