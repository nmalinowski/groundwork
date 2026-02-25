# Groundwork to Copilot CLI Migration Plan

## Goal

Convert all Groundwork agents, skills, commands, hooks, and plugin runtime behavior for use with Copilot CLI while preserving:

- Spec-driven workflow (`specs/product_specs*`, `specs/architecture*`, `specs/tasks*`)
- Worktree + TDD execution model
- Multi-agent validation loops
- Hook-based session/context automation

## Current Inventory (In Scope)

- Agents: 14 (`agents/*/AGENT.md`)
- Skills: 19 (`skills/*/SKILL.md`)
- Commands: 18 (`commands/*.md`)
- Hooks: 6 files (`hooks/hooks.json`, 4 shell scripts, `run-hook.cmd`)
- Plugin metadata: 1 (`.claude-plugin/plugin.json`)
- Runtime libs: 9 (`lib/*.js`)
- Tests: 5 (`tests/*.js`, `tests/run-tests.sh`)

## Migration Strategy

1. Build a Copilot-compatible plugin skeleton first.
2. Port runtime/hooks next (to preserve lifecycle behavior early).
3. Port orchestration skills and task-execution agent before other skills.
4. Port remaining agents/skills/commands in batches with regression checks.
5. Keep a compatibility layer so existing helper libs/tests continue working.

## Workstreams and Detailed Tasks

## WS0: Capability Spike and Contract Freeze

- [ ] **CP-001**: Create `docs/copilot-cli-capability-matrix.md` documenting verified Copilot CLI support for:
  - agent file format and locations
  - skill file format and locations
  - command format
  - hook lifecycle events and payload schema
  - subagent/delegation behavior
- [ ] **CP-002**: Create a minimal Copilot plugin prototype in `migration/copilot-prototype/` with:
  - 1 agent
  - 1 skill
  - 1 command
  - 1 hook
- [ ] **CP-003**: Record feature gaps vs Claude-only features (`Skill(...)`, `Task(...)`, `AskUserQuestion`, plan-mode semantics) and freeze replacement design decisions.

**Exit criteria:** approved compatibility matrix and signed-off replacement patterns.

## WS1: Plugin Metadata and Layout

- [ ] **CP-010**: Add Copilot plugin manifest file(s) in target structure (`copilot/` or `.github/` path selected in WS0).
- [ ] **CP-011**: Map metadata from `.claude-plugin/plugin.json` (name/version/description/homepage/license/keywords).
- [ ] **CP-012**: Add migration-time validation script for Copilot manifest schema.
- [ ] **CP-013**: Preserve backward compatibility by keeping Claude manifest unchanged until final cutover.

**Exit criteria:** Copilot plugin installs and is discoverable locally.

## WS2: Hook Runtime Port

- [ ] **CP-020**: Create Copilot hook config equivalent to `hooks/hooks.json`.
- [ ] **CP-021**: Port `hooks/session-start.sh` and replace Claude-specific env assumptions (`CLAUDE_PLUGIN_ROOT`, session variables) with Copilot equivalents + fallback shim.
- [ ] **CP-022**: Port `hooks/check-commit-alignment.sh` and verify post-command trigger behavior.
- [ ] **CP-023**: Port `hooks/validate-agent-output.sh` and enforce output contracts for delegated agents.
- [ ] **CP-024**: Port `hooks/pre-compact.sh` (or implement equivalent state-preservation strategy if no matching event exists).
- [ ] **CP-025**: Update `hooks/run-hook.cmd` for Windows invocation parity.
- [ ] **CP-026**: Add hook integration tests for all mapped events.

**Exit criteria:** all mapped hooks execute and inject/validate context correctly.

## WS3: Runtime Library Adaptation

- [ ] **CP-030**: Add runtime adapter module (`lib/runtime-adapter.js`) that abstracts:
  - environment variables
  - hook event names/payloads
  - command execution wrappers
- [ ] **CP-031**: Update `lib/skills-core.js` for Copilot skill discovery/loading rules.
- [ ] **CP-032**: Keep and reuse `lib/specs-io.js`, `lib/spec-router.js`, `lib/inject-specs.js` with minimal changes.
- [ ] **CP-033**: Update `lib/frontmatter.js` and `lib/validate-plugin.js` to validate Copilot-oriented metadata.
- [ ] **CP-034**: Verify `lib/check-updates.js` behavior with Copilot install path expectations.
- [ ] **CP-035**: Extend `tests/lib.test.js`, `tests/skills-core.test.js`, `tests/validate-plugin.test.js` for dual-schema validation during transition.

**Exit criteria:** core libs pass tests under Copilot-mode configuration.

## WS4: Agent Migration (14)

### Task pattern for each agent

- [ ] Rename/emit Copilot-compatible agent file.
- [ ] Translate front matter keys (name/description/model/turn limits/memory/skills).
- [ ] Preserve output contract lines used by validators.
- [ ] Add one focused fixture test per agent prompt contract.

### Agents backlog

- [ ] **CP-040**: `architecture-alignment-checker`
- [ ] **CP-041**: `architecture-task-alignment-checker`
- [ ] **CP-042**: `code-quality-reviewer`
- [ ] **CP-043**: `code-simplifier`
- [ ] **CP-044**: `design-consistency-checker`
- [ ] **CP-045**: `design-task-alignment-checker`
- [ ] **CP-046**: `housekeeper`
- [ ] **CP-047**: `performance-reviewer`
- [ ] **CP-048**: `prd-architecture-checker`
- [ ] **CP-049**: `prd-task-alignment-checker`
- [ ] **CP-050**: `researcher`
- [ ] **CP-051**: `security-reviewer`
- [ ] **CP-052**: `spec-alignment-checker`
- [ ] **CP-053**: `task-executor` (highest priority in this group)

**Exit criteria:** all migrated agents callable and producing parseable outputs.

## WS5: Skill Migration (19)

### Cross-cutting migration tasks

- [ ] **CP-060**: Define replacement pattern for `Skill(...)` chaining.
- [ ] **CP-061**: Define replacement pattern for `Task(...)`/subagent invocation.
- [ ] **CP-062**: Define replacement pattern for `AskUserQuestion` interactions.
- [ ] **CP-063**: Define replacement pattern for "Plan agent" requirement in `execute-task`.
- [ ] **CP-064**: Preserve structured `RESULT: ...` lines where downstream logic depends on them.

### Skills backlog

- [ ] **CP-070**: `using-groundwork`
- [ ] **CP-071**: `next-task`
- [ ] **CP-072**: `execute-task` (highest priority)
- [ ] **CP-073**: `implement-feature` (highest priority)
- [ ] **CP-074**: `use-git-worktree` (highest priority)
- [ ] **CP-075**: `test-driven-development` (highest priority)
- [ ] **CP-076**: `validation-loop` (highest priority)
- [ ] **CP-077**: `task-validation-loop` (highest priority)
- [ ] **CP-078**: `architecture`
- [ ] **CP-079**: `product-design`
- [ ] **CP-080**: `design-system`
- [ ] **CP-081**: `tasks`
- [ ] **CP-082**: `sync-specs`
- [ ] **CP-083**: `sync-architecture`
- [ ] **CP-084**: `sync-design-system`
- [ ] **CP-085**: `check-alignment`
- [ ] **CP-086**: `debugging`
- [ ] **CP-087**: `build-unplanned-feature`
- [ ] **CP-088**: `understanding-feature-requests`

**Exit criteria:** full command workflows execute without Claude-specific primitives.

## WS6: Command Migration (18)

### Task pattern for each command

- [ ] Convert command front matter to Copilot-compatible schema.
- [ ] Replace hard-coded Claude `Skill(...)` call instructions with Copilot invocation equivalent.
- [ ] Validate argument parsing and tool restrictions.
- [ ] Add command-level smoke test.

### Commands backlog

- [ ] **CP-090**: `build-unplanned.md`
- [ ] **CP-091**: `check-specs-alignment.md`
- [ ] **CP-092**: `create-tasks.md`
- [ ] **CP-093**: `debug.md`
- [ ] **CP-094**: `design-architecture.md`
- [ ] **CP-095**: `design-product.md`
- [ ] **CP-096**: `groundwork-check.md`
- [ ] **CP-097**: `groundwork-help.md`
- [ ] **CP-098**: `just-do-it.md`
- [ ] **CP-099**: `skills.md`
- [ ] **CP-100**: `source-architecture-from-code.md`
- [ ] **CP-101**: `source-product-specs-from-code.md`
- [ ] **CP-102**: `source-ux-design-from-code.md`
- [ ] **CP-103**: `split-spec.md`
- [ ] **CP-104**: `ux-design.md`
- [ ] **CP-105**: `validate.md`
- [ ] **CP-106**: `work-on-next-task.md`
- [ ] **CP-107**: `work-on.md`

**Exit criteria:** all commands registered, discoverable, and runnable in Copilot CLI.

## WS7: Docs and Operational Readiness

- [ ] **CP-110**: Update `README.md` installation and usage for Copilot CLI.
- [ ] **CP-111**: Add `docs/copilot-cli-getting-started.md`.
- [ ] **CP-112**: Add `docs/copilot-cli-command-comparison.md` (or merge into existing guide).
- [ ] **CP-113**: Update `docs/hooks-configuration.md` with Copilot event model.
- [ ] **CP-114**: Add migration guide from Claude plugin to Copilot plugin.

**Exit criteria:** contributor can install and run workflows from docs only.

## WS8: Verification, Cutover, and Rollback

- [ ] **CP-120**: Add CI job running all JS tests and migration validation checks.
- [ ] **CP-121**: Execute end-to-end acceptance tests:
  - planned task flow (`design-product` -> `design-architecture` -> `create-tasks` -> `work-on-next-task`)
  - ad-hoc flow (`build-unplanned`)
  - validation flows (`validate`, task validation loop)
- [ ] **CP-122**: Perform cross-platform verification (Linux/macOS/Windows shell behavior).
- [ ] **CP-123**: Define rollback strategy and feature flag for dual-runtime period.
- [ ] **CP-124**: Tag release and publish Copilot-ready package.

**Exit criteria:** acceptance tests pass and release checklist is signed off.

## Sequencing and Dependencies

- WS0 must finish before WS1-WS6 begin.
- WS2 and WS3 should finish before bulk skill/command migration.
- WS4, WS5, WS6 can run in parallel after runtime contract freeze.
- WS7 starts once first command/skill vertical slice works.
- WS8 runs after all migration backlogs are complete.

## Suggested Execution Order (Critical Path)

1. CP-001 -> CP-003
2. CP-010 -> CP-013
3. CP-020 -> CP-026
4. CP-030 -> CP-035
5. CP-053 + CP-072 + CP-073 + CP-074 + CP-075 + CP-076 + CP-077 + CP-107 (vertical slice)
6. Remaining agent/skill/command backlogs
7. CP-110 -> CP-124

## Risks and Mitigations

- Risk: Copilot lacks 1:1 equivalents for Claude hook events.
  - Mitigation: define fallback scripts and explicit command-driven checkpoints.
- Risk: No direct equivalent of `AskUserQuestion`.
  - Mitigation: standardize prompt blocks and deterministic default paths for non-interactive mode.
- Risk: Subagent orchestration semantics differ.
  - Mitigation: preserve strict `RESULT:` output contracts and validate with integration tests.
- Risk: Shell portability regressions.
  - Mitigation: maintain `run-hook.cmd`, add cross-platform CI coverage early.

## Definition of Done

- All 14 agents, 19 skills, 18 commands, and required hooks operate through Copilot CLI.
- Core workflows (`work-on`, `work-on-next-task`, `build-unplanned`, `validate`) pass E2E tests.
- Spec synchronization and validation behavior remains intact.
- Documentation and release process are Copilot-first and reproducible.
