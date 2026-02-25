#!/bin/bash
# Groundwork Plugin - Subagent Output Validator
#
# Runs on SubagentStop hook to verify agent outputs follow expected formats
# and match their system prompt requirements.
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
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] validate-agent-output: $1" >> "$DEBUG_LOG" 2>/dev/null || true
}

# Wrap main logic in function for error isolation
main() {
  runtime_name="$(gw_detect_runtime)"
  if [ "${runtime_name}" = "copilot" ]; then
    AGENT_EVENT="$(gw_hook_event_name postToolUse)"
  else
    AGENT_EVENT="$(gw_hook_event_name subagentStop)"
  fi

  if ! command -v python3 &> /dev/null; then
    cat << EOF
{"hookSpecificOutput":{"hookEventName":"${AGENT_EVENT}","additionalContext":""}}
EOF
    exit 0
  fi

  # Read JSON from stdin (Claude/Copilot format)
  INPUT_JSON=$(cat)

  # Exit if no input
  if [ -z "$INPUT_JSON" ]; then
    exit 0
  fi

  # Parse agent output and check for common issues
  VALIDATION_RESULT=$(echo "$INPUT_JSON" | python3 -c '
import json
import sys

try:
    data = json.load(sys.stdin)

    tool_name = str(data.get("toolName", "")).lower()
    # Copilot postToolUse payloads include many tool events; validate only delegate-like outputs.
    if tool_name and tool_name not in {"task", "delegate", "agent"}:
        print(json.dumps({"valid": True, "issues": [], "agent_type": "tool", "agent_name": tool_name}))
        raise SystemExit(0)

    agent_type = data.get("subagent_type", data.get("agent_type", data.get("toolName", "unknown")))
    agent_output = data.get("tool_output", data.get("output", ""))
    if not agent_output and isinstance(data.get("toolResult"), dict):
        agent_output = data.get("toolResult", {}).get("textResultForLlm", "")
    agent_name = data.get("subagent_name", data.get("name", data.get("toolName", "")))

    issues = []

    # Convert output to string for analysis
    output_str = str(agent_output) if agent_output else ""

    # Check for common validation issues

    # 1. Empty or very short outputs
    if len(output_str.strip()) < 10:
        issues.append("Agent returned very short or empty output")

    # 2. Check for error indicators in output (use word boundaries for accuracy)
    import re
    error_patterns = [
        r"\berror:",
        r"\bfailed:",
        r"\bexception:",
        r"\btraceback \(most recent call last\)"
    ]
    output_lower = output_str.lower()
    for pattern in error_patterns:
        if re.search(pattern, output_lower):
            issues.append(f"Agent output contains error indicator matching: {pattern}")

    # 3. Check if review agents provided a verdict
    if agent_type in ["code-reviewer", "spec-reviewer"]:
        has_verdict = any(v in output_lower for v in ["approved", "rejected", "issues:", "compliant", "non-compliant"])
        if not has_verdict:
            issues.append("Review agent may be missing clear verdict (approved/rejected)")

    # 4. Check for incomplete outputs (common pattern)
    incomplete_markers = ["...", "etc.", "and so on", "to be continued"]
    for marker in incomplete_markers:
        if marker in output_str:
            issues.append(f"Agent output may be incomplete (contains: {marker})")
            break

    print(json.dumps({
        "valid": len(issues) == 0,
        "issues": issues,
        "agent_type": agent_type,
        "agent_name": agent_name
    }))

except Exception as e:
    print(json.dumps({"valid": True, "issues": [], "error": str(e)}))
')

  # Check if validation found issues
  HAS_ISSUES=$(echo "$VALIDATION_RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('true' if d.get('issues') else 'false')")

  if [ "$HAS_ISSUES" = "true" ]; then
    ISSUES_STR=$(echo "$VALIDATION_RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print('; '.join(d.get('issues', [])))")
    AGENT_TYPE=$(echo "$VALIDATION_RESULT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('agent_type', 'unknown'))")

    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "${AGENT_EVENT}",
    "additionalContext": "Agent validation (${AGENT_TYPE}): ${ISSUES_STR}. Consider reviewing the agent output."
  }
}
EOF
  else
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "${AGENT_EVENT}",
    "additionalContext": ""
  }
}
EOF
  fi
}

# Run main with error recovery - always exit 0
if ! main 2>&1; then
  log_error "Main function failed, outputting minimal response"
  runtime_name="$(gw_detect_runtime)"
  if [ "${runtime_name}" = "copilot" ]; then
    AGENT_EVENT="$(gw_hook_event_name postToolUse)"
  else
    AGENT_EVENT="$(gw_hook_event_name subagentStop)"
  fi
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "${AGENT_EVENT}",
    "additionalContext": ""
  }
}
EOF
fi

exit 0
