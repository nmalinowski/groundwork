---
name: groundwork:just-do-it
description: Execute all remaining tasks in sequence until completion. Usage /groundwork:just-do-it
allowed-tools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "Task", "AskUserQuestion", "Skill"]
disable-model-invocation: true
---

CRITICAL INSTRUCTION: Before doing ANYTHING else, you MUST call the Skill tool with:
  Skill(skill="groundwork:execute-all-tasks")

Do NOT read files, explore code, or generate any response before invoking this skill. The skill contains your complete workflow and you must follow it exactly as presented to you.
