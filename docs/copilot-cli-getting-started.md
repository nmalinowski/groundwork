# Groundwork on Copilot CLI

## Install

From local repository:

```bash
copilot plugin install .
```

From GitHub:

```bash
copilot plugin install https://github.com/etr/groundwork
```

## Verify

1. Confirm plugin manifest exists: `plugin.json`
2. Confirm generated assets exist in `copilot/`
3. Start Copilot CLI and list loaded agents/skills/commands

## Regenerate Assets

When source files change (`agents/`, `skills/`, `commands/`, `hooks/`):

```bash
node tools/generate-copilot-assets.js
```

This refreshes:

- `copilot/agents/*.agent.md`
- `copilot/skills/*`
- `copilot/commands/*.md`
- `copilot/hooks.json`
- `plugin.json`

## Runtime Notes

- Hooks auto-detect runtime and map event names accordingly.
- State files are written to `~/.copilot/groundwork-state` in Copilot mode.
- Existing Claude plugin files remain intact for dual-runtime compatibility.
