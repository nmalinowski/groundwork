# Copilot CLI Capability Matrix for Groundwork

## Summary

Groundwork now ships a Copilot plugin manifest and generated Copilot assets. The table below maps original Claude capabilities to Copilot equivalents used in this repo.

| Groundwork Capability | Claude Implementation | Copilot Implementation in Repo | Status |
|---|---|---|---|
| Plugin manifest | `.claude-plugin/plugin.json` | `plugin.json`, `copilot/plugin.json` | Implemented |
| Agents | `agents/*/AGENT.md` | `copilot/agents/*.agent.md` | Implemented |
| Skills | `skills/*/SKILL.md` | `copilot/skills/*/SKILL.md` | Implemented |
| Commands | `commands/*.md` | `copilot/commands/*.md` wrappers | Implemented |
| Session start hook | `hooks/hooks.json` `SessionStart` | `copilot/hooks.json` `sessionStart` | Implemented |
| Post tool hook | `hooks/hooks.json` `PostToolUse` | `copilot/hooks.json` `postToolUse` | Implemented |
| Pre-compact/session end | `hooks/hooks.json` `PreCompact` | `copilot/hooks.json` `sessionEnd` | Implemented |
| Runtime env resolution | Claude env vars | `lib/runtime-adapter.js` + `hooks/runtime.sh` | Implemented |
| Spec routing/helpers | `lib/specs-io.js`, `lib/spec-router.js` | Reused unchanged | Implemented |
| Validation | `lib/validate-plugin.js` | Dual-schema validation (Claude + Copilot assets) | Implemented |

## Known Behavior Mappings

- `Skill(skill="groundwork:...")`:
  Copilot skill wrappers document equivalent `/<skill>` usage.
- `Task(...)`:
  Copilot wrappers instruct using delegated/custom agent workflows.
- `AskUserQuestion`:
  Copilot wrappers instruct direct user prompts and response wait.
- `PreCompact`:
  Mapped to Copilot `sessionEnd` hook flow.

## Regeneration Contract

Copilot assets are generated from source files with:

```bash
node tools/generate-copilot-assets.js
```

Source of truth remains:

- `agents/`
- `skills/`
- `commands/`
- `hooks/`
