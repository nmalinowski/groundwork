#!/usr/bin/env bash

# Shared runtime helpers for Groundwork hooks.

gw_detect_runtime() {
  if [ -n "${GROUNDWORK_RUNTIME:-}" ]; then
    printf '%s' "${GROUNDWORK_RUNTIME}"
    return 0
  fi
  if [ -n "${COPILOT_PLUGIN_ROOT:-}" ] || [ -n "${GITHUB_COPILOT_CONFIG_DIR:-}" ]; then
    printf 'copilot'
    return 0
  fi
  printf 'claude'
}

gw_plugin_root() {
  if [ -n "${GROUNDWORK_PLUGIN_ROOT:-}" ]; then
    printf '%s' "${GROUNDWORK_PLUGIN_ROOT}"
    return 0
  fi
  if [ -n "${COPILOT_PLUGIN_ROOT:-}" ]; then
    printf '%s' "${COPILOT_PLUGIN_ROOT}"
    return 0
  fi
  if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    printf '%s' "${CLAUDE_PLUGIN_ROOT}"
    return 0
  fi

  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]:-$0}")" && pwd)"
  cd "${script_dir}/.." && pwd
}

gw_state_dir() {
  if [ -n "${GROUNDWORK_STATE_DIR:-}" ]; then
    printf '%s' "${GROUNDWORK_STATE_DIR}"
    return 0
  fi

  local runtime
  runtime="$(gw_detect_runtime)"
  if [ "${runtime}" = "copilot" ]; then
    printf '%s' "${HOME}/.copilot/groundwork-state"
    return 0
  fi

  printf '%s' "${HOME}/.claude/groundwork-state"
}

gw_hook_event_name() {
  local canonical="$1"
  local runtime
  runtime="$(gw_detect_runtime)"

  if [ "${runtime}" = "copilot" ]; then
    case "${canonical}" in
      sessionStart) printf 'sessionStart' ;;
      sessionEnd) printf 'sessionEnd' ;;
      preToolUse) printf 'preToolUse' ;;
      postToolUse) printf 'postToolUse' ;;
      subagentStop) printf 'subagentStop' ;;
      preCompact) printf 'sessionEnd' ;;
      *) printf '%s' "${canonical}" ;;
    esac
    return 0
  fi

  case "${canonical}" in
    sessionStart) printf 'SessionStart' ;;
    sessionEnd) printf 'SessionEnd' ;;
    preToolUse) printf 'PreToolUse' ;;
    postToolUse) printf 'PostToolUse' ;;
    subagentStop) printf 'SubagentStop' ;;
    preCompact) printf 'PreCompact' ;;
    *) printf '%s' "${canonical}" ;;
  esac
}
