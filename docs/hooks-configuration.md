# Hooks Configuration

Groundwork supports hook automation in both Claude Code and GitHub Copilot CLI.

- Claude hooks config: `hooks/hooks.json`
- Copilot hooks config: `copilot/hooks.json`

## Default Hooks (Claude)

The plugin includes these hooks in `hooks/hooks.json`:

### SessionStart Hook

**Triggers:** Session startup, resume, clear, compact

**Purpose:**
- Creates required directories
- Validates dependencies
- Detects project state
- Loads skill context

**File:** `hooks/session-start.sh`

### PostToolUse Hook

**Triggers:** After `Bash` tool use

**Purpose:**
- Verifies commits align with specs/tasks.md after `git commit`

**File:** `hooks/check-commit-alignment.sh`

### SubagentStop Hook

**Triggers:** After any subagent completes (*)

**Purpose:**
- Validates agent output format

**File:** `hooks/validate-agent-output.sh`

### PreToolUse Hook

Currently empty — reserved for future use.

### PreCompact Hook

**Triggers:** Before context compaction (*)

**Purpose:**
- Preserves critical skill state before compaction
- Reports active tasks, current skill, pending observations
- Injects state summary into compacted context

**File:** `hooks/pre-compact.sh`

## Default Hooks (Copilot)

The generated Copilot hook configuration is in `copilot/hooks.json` and maps:

- `sessionStart` -> `hooks/session-start.sh`
- `postToolUse` -> `hooks/check-commit-alignment.sh`
- `postToolUse` -> `hooks/validate-agent-output.sh`
- `sessionEnd` -> `hooks/pre-compact.sh`

Copilot hook entries run with `GROUNDWORK_RUNTIME=copilot` so scripts adapt event names and state directories automatically.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_SESSION_ID` | (auto) | Used for session-scoped state |
| `GROUNDWORK_RUNTIME` | auto-detect | Force runtime mode (`claude` or `copilot`) |
| `GROUNDWORK_PLUGIN_ROOT` | (auto) | Override plugin root resolution for hooks |
| `GROUNDWORK_STATE_DIR` | (auto) | Override state directory for temp/preserved state |
| `GROUNDWORK_SKIP_UPDATE_CHECK` | 0 | Set to 1 to skip update checking |
| `GROUNDWORK_DEBUG` | 0 | Set to 1 to enable verbose hook output |

## Hook Output Format

Hooks communicate via JSON on stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Context to inject..."
  }
}
```

## Troubleshooting

### Hook Not Running

1. Check file permissions: `chmod 755 hooks/*.sh`
2. Verify paths use `${CLAUDE_PLUGIN_ROOT}`
3. Check dependencies (node, python3)

## Files Location

All hook state files are stored in:
- `/tmp/claude-groundwork/` or `/tmp/copilot-groundwork/` - runtime temp files
- `~/.claude/groundwork-state/` or `~/.copilot/groundwork-state/` - preserved session state
