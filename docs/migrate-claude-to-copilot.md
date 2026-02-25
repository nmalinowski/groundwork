# Migrate Groundwork from Claude Plugin to Copilot CLI

## What Changed

- Copilot manifest added at `plugin.json`.
- Copilot runtime assets generated into `copilot/`.
- Hook scripts now support both runtimes through `hooks/runtime.sh`.
- Validator and tests now verify both Claude and Copilot plugin structures.

## Migration Steps

1. Pull latest Groundwork repository changes.
2. Regenerate Copilot assets:
   - `node tools/generate-copilot-assets.js`
3. Install Copilot plugin from repo root:
   - `copilot plugin install .`
4. Run validation/tests:
   - `node lib/validate-plugin.js`
   - `node tests/run-tests.sh` (or run each JS test directly)

## Runtime Mapping

- Claude `SessionStart` -> Copilot `sessionStart`
- Claude `PostToolUse` -> Copilot `postToolUse`
- Claude `PreCompact` -> Copilot `sessionEnd`
- Claude `SubagentStop` -> Copilot `postToolUse` for delegated agent/tool results

## Source of Truth

Do not edit generated `copilot/*` files manually. Edit source assets and regenerate:

- `agents/*/AGENT.md`
- `skills/*/SKILL.md`
- `commands/*.md`
- `hooks/*`

Then run:

```bash
node tools/generate-copilot-assets.js
```
