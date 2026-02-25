#!/usr/bin/env node

/**
 * Validates the Groundwork plugin for common issues:
 * - YAML frontmatter parsing
 * - File references existence
 * - Naming conventions
 * - Consistent field usage
 * - Hook script existence
 */

const fs = require('fs');
const path = require('path');
const { extractFrontmatter } = require('./frontmatter');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const COPILOT_ROOT = path.join(PLUGIN_ROOT, 'copilot');

const issues = [];
const warnings = [];

function addIssue(file, message, severity = 'error') {
  const relativePath = path.relative(PLUGIN_ROOT, file);
  if (severity === 'warning') {
    warnings.push({ file: relativePath, message });
  } else {
    issues.push({ file: relativePath, message });
  }
}

function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

function checkFile(filePath) {
  const normalizedPath = normalizePath(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const fm = extractFrontmatter(content);

  if (!fm) {
    addIssue(filePath, 'Missing or invalid YAML frontmatter');
    return;
  }

  // Check for required fields
  if (!fm.name) {
    addIssue(filePath, 'Missing required field: name');
  }

  if (!fm.description) {
    addIssue(filePath, 'Missing required field: description');
  }

  // Check for non-standard fields in skills
  if (normalizedPath.includes('/skills/')) {
    const allowedFields = ['name', 'description', 'requires', 'user-invocable', 'license', 'target', 'infer', 'model'];
    for (const key of Object.keys(fm)) {
      if (!allowedFields.includes(key)) {
        addIssue(filePath, `Non-standard field in skill frontmatter: ${key}`, 'warning');
      }
    }

    // Check description format
    if (fm.description && !fm.description.startsWith('This skill should be used when') && !fm.description.startsWith('This skill should be used at')) {
      addIssue(filePath, 'Description should start with "This skill should be used when/at..." for third-person format', 'warning');
    }
  }

  // Check for literal \n in descriptions (common YAML mistake)
  if (fm.description && fm.description.includes('\\n')) {
    addIssue(filePath, 'Description contains literal \\n - use YAML block scalar (|) for multi-line');
  }

  // Check name format (supports optional namespace prefix like "groundwork:skill-name")
  if (fm.name && !/^([a-z0-9-]+:)?[a-z0-9-]+$/.test(fm.name)) {
    addIssue(filePath, `Name should use only lowercase letters, numbers, hyphens, and optional namespace prefix: ${fm.name}`, 'warning');
  }

  // Check for allowed-tools vs allowed_tools consistency
  if (fm.allowed_tools) {
    addIssue(filePath, 'Use "allowed-tools" (hyphen) instead of "allowed_tools" (underscore)');
  }

  // Check for non-empty allowed-tools when declared (commands only)
  if (normalizedPath.includes('/commands/')) {
    // Check if allowed-tools is declared but empty
    const rawContent = content.match(/^---\n([\s\S]*?)\n---/);
    if (rawContent) {
      const hasAllowedToolsKey = /^allowed-tools\s*:/m.test(rawContent[1]);
      const allowedToolsValue = fm['allowed-tools'];
      const isEmpty = !allowedToolsValue ||
                      (typeof allowedToolsValue === 'string' && allowedToolsValue.trim() === '') ||
                      (Array.isArray(allowedToolsValue) && allowedToolsValue.length === 0);
      if (hasAllowedToolsKey && isEmpty) {
        addIssue(filePath, 'allowed-tools is declared but has no values');
      }
    }

    // Check for missing argument-hint when command accepts arguments
    const usesArguments = content.includes('$ARGUMENTS') ||
                          /^##?\s*Arguments/m.test(content) ||
                          /^Options:/m.test(content);
    const hasArgumentHint = fm['argument-hint'];
    if (usesArguments && !hasArgumentHint) {
      addIssue(filePath, 'Command accepts arguments but missing argument-hint in frontmatter', 'warning');
    }
  }

  // Store requires field for dependency validation (done later)
  if (fm.requires) {
    let requires = [];
    if (Array.isArray(fm.requires)) {
      requires = fm.requires.map(s => String(s).trim()).filter(s => s);
    } else {
      requires = fm.requires.split(',').map(s => s.trim()).filter(s => s);
    }
    if (requires.length > 0) {
      // Store for cross-validation
      if (!global.skillRequirements) global.skillRequirements = [];
      global.skillRequirements.push({
        file: filePath,
        name: fm.name,
        requires: requires
      });
    }
  }

  // Check for @ references in content (anti-pattern)
  // Look for standalone @mention patterns, not email addresses
  // Match @ followed by word, but only when not preceded by word char (email pattern)
  // First strip out code blocks and inline code to avoid false positives on examples
  const contentWithoutCodeBlocks = content
    .replace(/```[\s\S]*?```/g, '')  // fenced code blocks
    .replace(/`[^`]+`/g, '');        // inline code
  const atRefPattern = /(?<![a-zA-Z0-9._%+-])@([a-zA-Z][\w.-]+)/g;
  let atMatch;
  while ((atMatch = atRefPattern.exec(contentWithoutCodeBlocks)) !== null) {
    const ref = atMatch[0];
    const refName = atMatch[1];
    // Skip JSDoc annotations
    if (ref === '@param' || ref === '@returns' || ref === '@type' ||
        ref === '@example' || ref === '@see' || ref === '@deprecated' ||
        ref === '@private' || ref === '@public') continue;
    // Skip npm scoped packages (e.g., @playwright/test, @types/node)
    if (ref.startsWith('@playwright') || ref.startsWith('@types') ||
        ref.startsWith('@testing-library') || ref.startsWith('@babel') ||
        ref.startsWith('@jest') || ref.startsWith('@vitest')) continue;
    // Skip local file references (e.g., @example-file.md, @helper.js)
    // These are relative files in the same directory, not skill path references
    if (/\.(md|js|ts|sh|py|json|yaml|yml|txt)$/.test(refName)) continue;
    addIssue(filePath, `@ syntax used (anti-pattern): ${ref}`, 'warning');
  }
}

function checkDirectory(dir, pattern) {
  if (!fs.existsSync(dir)) return;
  const normalizedDir = normalizePath(dir);

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // For skills, check SKILL.md in subdirectory
      if (normalizedDir.includes('/skills')) {
        const skillFile = path.join(fullPath, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          checkFile(skillFile);
        }
      } else {
        checkDirectory(fullPath, pattern);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // For agents and commands, check .md files directly
      if (normalizedDir.includes('/agents') || normalizedDir.includes('/commands')) {
        checkFile(fullPath);
      }
    }
  }
}

function checkFileReferences() {
  // Check for broken file references in skills
  const skillsDir = path.join(PLUGIN_ROOT, 'skills');
  if (!fs.existsSync(skillsDir)) return;

  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const skillName of skillDirs) {
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, 'utf-8');

    // Check for explicit references to supporting files in this skill directory
    // Look for patterns like "See `filename.md`" or "`filename.md` in this directory"
    // Skip generic mentions of files in error messages or paths like `specs/tasks.md`
    const explicitRefPatterns = [
      /[Ss]ee\s+`([a-z][a-z0-9-]*\.(md|js|ts|sh|dot))`/g,
      /`([a-z][a-z0-9-]*\.(md|js|ts|sh|dot))`\s+in this directory/g,
      /script\s+`([a-z][a-z0-9-]*\.(md|js|ts|sh|dot))`/g,
    ];

    for (const pattern of explicitRefPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const fileName = match[1];
        const refPath = path.join(skillsDir, skillName, fileName);
        if (!fs.existsSync(refPath)) {
          addIssue(skillFile, `Referenced file not found: ${fileName}`);
        }
      }
    }
  }
}

function checkHookPermissionsForDir(hooksDir) {
  if (!fs.existsSync(hooksDir)) return;
  if (process.platform === 'win32') return;

  const entries = fs.readdirSync(hooksDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const lowerName = entry.name.toLowerCase();
    if (!lowerName.endsWith('.js') && !lowerName.endsWith('.sh') && !lowerName.endsWith('.py')) continue;

    const fullPath = path.join(hooksDir, entry.name);
    const stats = fs.statSync(fullPath);
    const mode = stats.mode & 0o777;

    if ((mode & 0o111) === 0) {
      addIssue(fullPath, 'Script missing execute permission', 'warning');
    }
  }
}

function checkHookPermissions() {
  checkHookPermissionsForDir(path.join(PLUGIN_ROOT, 'hooks'));
  checkHookPermissionsForDir(path.join(COPILOT_ROOT, 'hooks'));
}

function checkSkillDependencies() {
  // Get all skill names
  const skillsDir = path.join(PLUGIN_ROOT, 'skills');
  if (!fs.existsSync(skillsDir)) return;

  const skillNames = new Set();
  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const skillName of skillDirs) {
    const skillFile = path.join(skillsDir, skillName, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      // Extract name from frontmatter
      const content = fs.readFileSync(skillFile, 'utf8');
      const fm = extractFrontmatter(content);
      skillNames.add(fm && fm.name ? fm.name : skillName);
    }
  }

  // Validate requirements
  if (global.skillRequirements) {
    for (const { file, name, requires } of global.skillRequirements) {
      for (const requiredSkill of requires) {
        if (!skillNames.has(requiredSkill)) {
          addIssue(file, `Required skill not found: "${requiredSkill}"`);
        }
      }
    }
  }
}

function extractHookScriptCandidates(hookConfig) {
  const scripts = [];
  if (!hookConfig || typeof hookConfig !== 'object') return scripts;

  if (hookConfig.command) scripts.push(hookConfig.command);
  if (hookConfig.bash) scripts.push(hookConfig.bash);
  if (hookConfig.powershell) scripts.push(hookConfig.powershell);
  return scripts;
}

function resolveHookScriptPath(rawCommand, hooksBaseDir) {
  if (!rawCommand || typeof rawCommand !== 'string') return null;
  const trimmed = rawCommand.trim();

  // Claude-style absolute variable references
  const claudeMatch = trimmed.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s]+)/);
  if (claudeMatch) {
    return path.join(PLUGIN_ROOT, claudeMatch[1]);
  }
  const copilotMatch = trimmed.match(/\$\{COPILOT_PLUGIN_ROOT\}\/([^\s]+)/);
  if (copilotMatch) {
    return path.join(PLUGIN_ROOT, copilotMatch[1]);
  }

  // Relative shell paths (Copilot hooks schema)
  let candidate = trimmed.split(/\s+/)[0];
  if (candidate === 'bash' || candidate === 'python3' || candidate === 'node' || candidate === 'sh' || candidate === 'pwsh') {
    candidate = trimmed.split(/\s+/)[1] || '';
  }
  candidate = candidate.replace(/^['"]|['"]$/g, '');
  candidate = candidate.replace(/^\.\\/, './').replace(/\\/g, '/');

  if (!candidate) return null;
  if (candidate.startsWith('./')) {
    return path.resolve(hooksBaseDir, candidate.slice(2));
  }
  if (candidate.startsWith('../')) {
    return path.resolve(hooksBaseDir, candidate);
  }
  if (/^[A-Za-z]:\//.test(candidate) || candidate.startsWith('/')) {
    return candidate;
  }

  // run-hook.cmd style invocation: ".\hooks\run-hook.cmd script.sh"
  if (candidate.includes('run-hook.cmd')) {
    return path.resolve(hooksBaseDir, candidate);
  }

  return null;
}

function iterateHookCommands(hooksConfig, callback) {
  const hooks = hooksConfig.hooks || {};
  for (const [eventName, hookEntries] of Object.entries(hooks)) {
    for (const entry of hookEntries || []) {
      // Claude schema: { matcher, hooks: [ {type, command} ] }
      if (Array.isArray(entry.hooks)) {
        for (const hook of entry.hooks) {
          callback(eventName, hook);
        }
        continue;
      }
      // Copilot schema: direct hook objects in event array
      callback(eventName, entry);
    }
  }
}

function checkHookScriptExistenceForConfig(hooksJsonPath) {
  if (!fs.existsSync(hooksJsonPath)) return;

  let hooksConfig;
  try {
    const content = fs.readFileSync(hooksJsonPath, 'utf8');
    hooksConfig = JSON.parse(content);
  } catch (e) {
    addIssue(hooksJsonPath, `Invalid JSON: ${e.message}`);
    return;
  }

  const hooksBaseDir = path.dirname(hooksJsonPath);
  iterateHookCommands(hooksConfig, (eventName, hook) => {
    if (hook.type !== 'command') return;
    for (const scriptCandidate of extractHookScriptCandidates(hook)) {
      const resolved = resolveHookScriptPath(scriptCandidate, hooksBaseDir);
      if (!resolved) continue;
      if (!fs.existsSync(resolved)) {
        addIssue(hooksJsonPath, `Hook script not found: ${scriptCandidate} (${eventName} event)`);
      }
    }
  });
}

function checkHookScriptExistence() {
  checkHookScriptExistenceForConfig(path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'));
  checkHookScriptExistenceForConfig(path.join(COPILOT_ROOT, 'hooks.json'));
}

function checkHookMatchers() {
  const hooksJsonPath = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
  if (!fs.existsSync(hooksJsonPath)) return;

  let hooksConfig;
  try {
    const content = fs.readFileSync(hooksJsonPath, 'utf8');
    hooksConfig = JSON.parse(content);
  } catch {
    return; // JSON errors already reported by checkHookScriptExistence
  }

  const hooks = hooksConfig.hooks || {};

  // Valid matchers for different hook events
  const validSessionMatchers = ['startup', 'resume', 'clear', 'compact'];
  const validToolMatchers = ['Edit', 'Write', 'MultiEdit', 'Read', 'Bash', 'Glob', 'Grep', 'Task', 'WebFetch', 'WebSearch', '*'];

  for (const [eventName, hookEntries] of Object.entries(hooks)) {
    for (const entry of hookEntries) {
      const matcher = entry.matcher;
      if (!matcher) continue;

      // Parse matcher (could be "startup|resume" or "Edit|Write" or "*")
      const matcherParts = matcher.split('|').map(s => s.trim());

      for (const part of matcherParts) {
        if (part === '*') continue; // Wildcard always valid

        if (eventName === 'SessionStart') {
          if (!validSessionMatchers.includes(part)) {
            addIssue(hooksJsonPath, `Unknown SessionStart matcher "${part}" - valid: ${validSessionMatchers.join(', ')}`, 'warning');
          }
        } else if (['PreToolUse', 'PostToolUse'].includes(eventName)) {
          if (!validToolMatchers.includes(part)) {
            addIssue(hooksJsonPath, `Unknown ${eventName} tool matcher "${part}" - valid: ${validToolMatchers.join(', ')}`, 'warning');
          }
        }
        // Note: SubagentStop and PreCompact events typically use wildcard matchers ("*")
        // and are intentionally not validated here since they don't have a fixed set of
        // valid matcher values like SessionStart or tool-use events do.
      }
    }
  }
}

function checkCopilotHooksSchema() {
  const hooksJsonPath = path.join(COPILOT_ROOT, 'hooks.json');
  if (!fs.existsSync(hooksJsonPath)) return;

  let hooksConfig;
  try {
    hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
  } catch (e) {
    addIssue(hooksJsonPath, `Invalid JSON: ${e.message}`);
    return;
  }

  if (hooksConfig.version !== 1) {
    addIssue(hooksJsonPath, 'Copilot hooks.json should set "version": 1', 'warning');
  }

  if (!hooksConfig.hooks || typeof hooksConfig.hooks !== 'object') {
    addIssue(hooksJsonPath, 'Copilot hooks.json missing "hooks" object');
    return;
  }
}

function checkManifest(filePath, runtime) {
  if (!fs.existsSync(filePath)) return;
  const manifestDir = path.dirname(filePath);

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    addIssue(filePath, `Invalid JSON: ${e.message}`);
    return;
  }

  for (const key of ['name', 'description', 'version']) {
    if (!manifest[key]) addIssue(filePath, `Missing required field: ${key}`);
  }

  if (runtime === 'copilot') {
    const components = ['agents', 'skills', 'commands', 'hooks'];
    for (const key of components) {
      if (!manifest[key]) {
        addIssue(filePath, `Missing copilot component path: ${key}`, 'warning');
        continue;
      }
      const referenced = path.resolve(manifestDir, manifest[key]);
      if (!fs.existsSync(referenced)) {
        addIssue(filePath, `Referenced path not found for "${key}": ${manifest[key]}`);
      }
    }
  }
}

function runValidation() {
  issues.length = 0;
  warnings.length = 0;
  global.skillRequirements = [];

  checkManifest(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'claude');
  checkManifest(path.join(PLUGIN_ROOT, 'plugin.json'), 'copilot');
  checkManifest(path.join(COPILOT_ROOT, 'plugin.json'), 'copilot');

  checkDirectory(path.join(PLUGIN_ROOT, 'skills'), 'SKILL.md');
  checkDirectory(path.join(PLUGIN_ROOT, 'agents'), '*.md');
  checkDirectory(path.join(PLUGIN_ROOT, 'commands'), '*.md');
  checkDirectory(path.join(COPILOT_ROOT, 'skills'), 'SKILL.md');
  checkDirectory(path.join(COPILOT_ROOT, 'agents'), '*.md');
  checkDirectory(path.join(COPILOT_ROOT, 'commands'), '*.md');
  checkFileReferences();
  checkHookPermissions();
  checkHookScriptExistence();
  checkHookMatchers();
  checkCopilotHooksSchema();
  checkSkillDependencies();

  return {
    issues: [...issues],
    warnings: [...warnings]
  };
}

function printValidationResults(result) {
  const localIssues = result.issues || [];
  const localWarnings = result.warnings || [];

  console.log('Validating Groundwork plugin...\n');

  if (localIssues.length === 0 && localWarnings.length === 0) {
    console.log('All checks passed!\n');
    return 0;
  }

  if (localIssues.length > 0) {
    console.log(`Found ${localIssues.length} error(s):\n`);
    for (const issue of localIssues) {
      console.log(`  [ERROR] ${issue.file}`);
      console.log(`          ${issue.message}\n`);
    }
  }

  if (localWarnings.length > 0) {
    console.log(`Found ${localWarnings.length} warning(s):\n`);
    for (const warning of localWarnings) {
      console.log(`  [WARN]  ${warning.file}`);
      console.log(`          ${warning.message}\n`);
    }
  }

  console.log(`\nSummary: ${localIssues.length} error(s), ${localWarnings.length} warning(s)`);
  return localIssues.length > 0 ? 1 : 0;
}

module.exports = {
  runValidation,
  printValidationResults
};

if (require.main === module) {
  const exitCode = printValidationResults(runValidation());
  process.exit(exitCode);
}
