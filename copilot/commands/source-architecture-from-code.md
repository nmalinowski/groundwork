---
name: groundwork-source-architecture-from-code
description: Synchronize architecture document with codebase changes. Usage /groundwork:source-architecture-from-code
argument-hint: "[files...]"
---

# Copilot Command: /source-architecture-from-code

- Generated from Claude command file.
- Primary skill: `/sync-architecture`.

## Execution Instructions

1. Parse arguments according to `argument-hint` if present.
2. Run the mapped skill workflow and preserve all task/spec constraints.
3. If user confirmation is required, ask directly and wait for response.
4. Preserve structured `RESULT:` output lines when present in skill contracts.

## Source Body (for compatibility)

CRITICAL INSTRUCTION: Before doing ANYTHING else, you MUST call the Skill tool with:
  Skill(skill="groundwork:sync-architecture")

Do NOT read files, explore code, or generate any response before invoking this skill. The skill contains your complete workflow and you must follow it exactly as presented to you.
