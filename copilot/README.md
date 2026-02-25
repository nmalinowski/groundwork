# Groundwork Copilot Plugin Assets

This directory is generated from the Claude-oriented source assets in this repository.

Generated content:

- `agents/*.agent.md` from `agents/*/AGENT.md`
- `skills/*/SKILL.md` from `skills/*/SKILL.md`
- `commands/*.md` from `commands/*.md`
- `hooks.json` and `hooks/*` from `hooks/*`

Regenerate after source changes:

```bash
node tools/generate-copilot-assets.js
```
