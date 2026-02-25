const os = require('os');
const path = require('path');

const RUNTIME = Object.freeze({
  CLAUDE: 'claude',
  COPILOT: 'copilot'
});

const HOOK_EVENT_NAMES = Object.freeze({
  [RUNTIME.CLAUDE]: {
    sessionStart: 'SessionStart',
    preToolUse: 'PreToolUse',
    postToolUse: 'PostToolUse',
    subagentStop: 'SubagentStop',
    preCompact: 'PreCompact'
  },
  [RUNTIME.COPILOT]: {
    sessionStart: 'sessionStart',
    sessionEnd: 'sessionEnd',
    preToolUse: 'preToolUse',
    postToolUse: 'postToolUse',
    subagentStop: 'subagentStop',
    preCompact: 'sessionEnd'
  }
});

function detectRuntime(env = process.env) {
  const explicit = (env.GROUNDWORK_RUNTIME || '').toLowerCase().trim();
  if (explicit === RUNTIME.COPILOT || explicit === RUNTIME.CLAUDE) {
    return explicit;
  }

  if (env.COPILOT_PLUGIN_ROOT || env.GITHUB_COPILOT_WORKSPACE || env.GITHUB_COPILOT_CONFIG_DIR) {
    return RUNTIME.COPILOT;
  }

  return RUNTIME.CLAUDE;
}

function getPluginRoot(scriptDir, env = process.env) {
  const explicit = env.GROUNDWORK_PLUGIN_ROOT;
  if (explicit) return explicit;

  if (env.COPILOT_PLUGIN_ROOT) return env.COPILOT_PLUGIN_ROOT;
  if (env.CLAUDE_PLUGIN_ROOT) return env.CLAUDE_PLUGIN_ROOT;

  if (scriptDir) return path.resolve(scriptDir, '..');
  return path.resolve(__dirname, '..');
}

function getStateDir(runtime = detectRuntime(), env = process.env) {
  if (env.GROUNDWORK_STATE_DIR) return env.GROUNDWORK_STATE_DIR;

  if (runtime === RUNTIME.COPILOT) {
    return path.join(os.homedir(), '.copilot', 'groundwork-state');
  }

  return path.join(os.homedir(), '.claude', 'groundwork-state');
}

function getTempDirName(runtime = detectRuntime()) {
  return runtime === RUNTIME.COPILOT ? 'copilot-groundwork' : 'claude-groundwork';
}

function getHookEventName(canonicalName, runtime = detectRuntime()) {
  const table = HOOK_EVENT_NAMES[runtime] || HOOK_EVENT_NAMES[RUNTIME.CLAUDE];
  return table[canonicalName] || canonicalName;
}

module.exports = {
  RUNTIME,
  detectRuntime,
  getPluginRoot,
  getStateDir,
  getTempDirName,
  getHookEventName
};
