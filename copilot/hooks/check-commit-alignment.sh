#!/bin/bash
# Groundwork Plugin - Post-Commit Alignment Check
#
# Runs after Bash tool use to check if a git commit was made
# and whether it aligns with active tasks or specs/tasks.md.
#
# Error Recovery: Uses defensive error handling to never break Claude Code sessions.

# Runtime helpers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
# shellcheck source=./runtime.sh
source "${SCRIPT_DIR}/runtime.sh"

# Error handling - log errors to debug file, never fail
DEBUG_LOG="$(gw_state_dir)/hook-errors.log"
mkdir -p "$(dirname "$DEBUG_LOG")" 2>/dev/null || true

log_error() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] check-commit-alignment: $1" >> "$DEBUG_LOG" 2>/dev/null || true
}

# Wrap main logic in function for error isolation
main() {
  POST_TOOL_EVENT="$(gw_hook_event_name postToolUse)"

  # Check if python3 is available
  if ! command -v python3 &> /dev/null; then
    # Output empty context and exit gracefully
    cat << EOF
{"hookSpecificOutput":{"hookEventName":"${POST_TOOL_EVENT}","additionalContext":""}}
EOF
    exit 0
  fi

  # Read JSON from stdin (Claude and Copilot hook format)
  INPUT_JSON=$(cat)

  # Exit if no input
  if [ -z "$INPUT_JSON" ]; then
    exit 0
  fi

  # Check if this was a git commit command
  IS_COMMIT=$(echo "$INPUT_JSON" | python3 -c '
import json
import sys

try:
    data = json.load(sys.stdin)

    command = ""
    tool_input = data.get("tool_input", {})
    if isinstance(tool_input, dict):
        command = tool_input.get("command", "")
    elif tool_input:
        command = str(tool_input)

    if not command:
        tool_args = data.get("toolArgs")
        if isinstance(tool_args, dict):
            command = tool_args.get("command", "")
        elif isinstance(tool_args, str):
            command = tool_args
        elif tool_args is not None:
            command = str(tool_args)

    if not command and isinstance(data.get("input"), dict):
        command = str(data["input"].get("command", ""))

    # Check if this looks like a git commit
    if "git commit" in command.lower():
        print("true")
    else:
        print("false")
except:
    print("false")
')

  # Exit if not a git commit
  if [ "$IS_COMMIT" != "true" ]; then
    exit 0
  fi

  # Extract commit message from the tool output
  COMMIT_MSG=$(echo "$INPUT_JSON" | python3 -c '
import json
import sys
import re

try:
    data = json.load(sys.stdin)
    tool_output = data.get("tool_output", "")
    if not tool_output and isinstance(data.get("toolResult"), dict):
      tool_output = data.get("toolResult", {}).get("textResultForLlm", "")
    if not tool_output and "output" in data:
      tool_output = data.get("output", "")

    # Try to extract commit message from output
    # Common patterns: "[branch abc123] Commit message"
    match = re.search(r"\[[\w/-]+ [a-f0-9]+\] (.+)", str(tool_output))
    if match:
        print(match.group(1))
    else:
        print("")
except:
    print("")
')

  # Skip if we couldn't extract commit message
  if [ -z "$COMMIT_MSG" ]; then
    exit 0
  fi

  # Check for active tasks file (specs/tasks.md, specs/tasks/, or similar)
  TASKS_FILE=""
  TASKS_IS_DIR=false
  for candidate in "specs/tasks.md" "docs/tasks.md" "TASKS.md" ".tasks.md"; do
    if [ -f "$candidate" ]; then
      TASKS_FILE="$candidate"
      break
    fi
  done

  # Check for directory-based tasks if no file found
  if [ -z "$TASKS_FILE" ] && [ -d "specs/tasks" ]; then
    # Use the _index.md or aggregate files in tasks directory
    if [ -f "specs/tasks/_index.md" ]; then
      TASKS_FILE="specs/tasks/_index.md"
      TASKS_IS_DIR=true
    fi
  fi

  # Build alignment context
  CONTEXT_ITEMS=()

  # Only check task alignment if tasks file exists AND has incomplete tasks
  if [ -n "$TASKS_FILE" ]; then
    # Check if there are incomplete tasks (lines with "[ ]" or "- [ ]")
    HAS_INCOMPLETE_TASKS=$(grep -E "^\s*[-*]\s*\[ \]" "$TASKS_FILE" 2>/dev/null | head -1)

    if [ -n "$HAS_INCOMPLETE_TASKS" ]; then
      # Look for task references in commit message (e.g., "Task 1:", "#1", "task-name", etc.)
      if echo "$COMMIT_MSG" | grep -qiE "(task|#)[[:space:]]*[0-9]+|implements|completes|fixes"; then
        HAS_TASK_REF="yes"
      else
        HAS_TASK_REF="no"
      fi

      # Only warn if commit doesn't reference a task AND there are incomplete tasks
      if [ "$HAS_TASK_REF" = "no" ]; then
        # Get first incomplete task as suggestion
        FIRST_TASK=$(grep -E "^\s*[-*]\s*\[ \]" "$TASKS_FILE" 2>/dev/null | head -1 | sed 's/.*\[ \]//' | sed 's/^[[:space:]]*//' | cut -c1-50)
        if [ -n "$FIRST_TASK" ]; then
          CONTEXT_ITEMS+=("Commit doesn't reference a task. Next incomplete: ${FIRST_TASK}...")
        fi
      fi
    fi
    # If no incomplete tasks, don't warn - all tasks are done
  fi

  # Output alignment reminder if there are concerns
  if [ ${#CONTEXT_ITEMS[@]} -gt 0 ]; then
    CONTEXT_STR=$(printf "%s\n" "${CONTEXT_ITEMS[@]}" | tr '\n' '; ')

    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "${POST_TOOL_EVENT}",
    "additionalContext": "Commit alignment check: ${CONTEXT_STR%%; }. Consider verifying the commit aligns with current work."
  }
}
EOF
  else
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "${POST_TOOL_EVENT}",
    "additionalContext": ""
  }
}
EOF
  fi
}

# Run main with error recovery - always exit 0
if ! main 2>&1; then
  log_error "Main function failed, outputting minimal response"
  POST_TOOL_EVENT="$(gw_hook_event_name postToolUse)"
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "${POST_TOOL_EVENT}",
    "additionalContext": ""
  }
}
EOF
fi

exit 0
