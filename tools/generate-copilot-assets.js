#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extractFrontmatter, stripFrontmatter } = require('../lib/frontmatter');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PLUGIN_MANIFEST = path.join(ROOT, '.claude-plugin', 'plugin.json');
const OUTPUT_ROOT = path.join(ROOT, 'copilot');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function copyDirRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  ensureDir(dst);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function yamlValue(value) {
  if (Array.isArray(value)) {
    const rendered = value.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(', ');
    return `[${rendered}]`;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return String(value);
}

function buildFrontmatter(fields) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    lines.push(`${key}: ${yamlValue(value)}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n`;
}

function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  ensureDir(dirPath);
}

function parseSkillCall(content) {
  const match = content.match(/Skill\(skill=["']groundwork:([^"']+)["']\)/);
  return match ? match[1] : null;
}

function migrateAgents() {
  const sourceAgentsRoot = path.join(ROOT, 'agents');
  const targetAgentsRoot = path.join(OUTPUT_ROOT, 'agents');
  ensureDir(targetAgentsRoot);

  const entries = fs.readdirSync(sourceAgentsRoot, { withFileTypes: true }).filter(e => e.isDirectory());
  for (const entry of entries) {
    const sourceFile = path.join(sourceAgentsRoot, entry.name, 'AGENT.md');
    if (!fs.existsSync(sourceFile)) continue;
    const content = readText(sourceFile);
    const fm = extractFrontmatter(content) || {};
    const body = stripFrontmatter(content);

    const targetFm = {
      name: fm.name || entry.name,
      description: fm.description || `${entry.name} custom agent`,
      target: 'github-copilot',
      infer: true,
      model: fm.model && fm.model !== 'inherit' ? fm.model : undefined
    };

    const migratedBody = [
      '# Copilot Migration Notes',
      '',
      '- Generated from `agents/*/AGENT.md`.',
      '- Workflow intent is preserved; Claude-specific metadata keys were removed.',
      '- Use this agent via `/agent` or `copilot --agent <id>`.',
      '',
      body
    ].join('\n');

    const target = path.join(targetAgentsRoot, `${entry.name}.agent.md`);
    writeText(target, `${buildFrontmatter(targetFm)}\n${migratedBody.trim()}\n`);
  }
}

function migrateSkills() {
  const sourceSkillsRoot = path.join(ROOT, 'skills');
  const targetSkillsRoot = path.join(OUTPUT_ROOT, 'skills');
  ensureDir(targetSkillsRoot);

  const entries = fs.readdirSync(sourceSkillsRoot, { withFileTypes: true }).filter(e => e.isDirectory());
  for (const entry of entries) {
    const srcDir = path.join(sourceSkillsRoot, entry.name);
    const dstDir = path.join(targetSkillsRoot, entry.name);
    copyDirRecursive(srcDir, dstDir);

    const skillFile = path.join(dstDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;
    const content = readText(skillFile);
    const body = stripFrontmatter(content);
    const fm = extractFrontmatter(content) || {};

    const targetFm = {
      name: fm.name || entry.name,
      description: fm.description || `Skill for ${entry.name}`,
      license: fm.license || 'MIT'
    };

    const compatibilityNotes = [
      '## Copilot Compatibility Notes',
      '',
      '- `Skill(skill="groundwork:<name>")` should be interpreted as using the corresponding `/<name>` skill.',
      '- `Task(...)` references should be handled with Copilot custom agents (`/agent`) or delegated workflows.',
      '- `AskUserQuestion` references should be handled by asking the user directly and waiting for input.',
      '- `Plan`/`ExitPlanMode` references map to Copilot plan mode toggling.',
      ''
    ].join('\n');

    const migratedBody = `${compatibilityNotes}\n${body.trim()}\n`;
    writeText(skillFile, `${buildFrontmatter(targetFm)}\n${migratedBody}`);
  }
}

function migrateCommands() {
  const sourceCommandsRoot = path.join(ROOT, 'commands');
  const targetCommandsRoot = path.join(OUTPUT_ROOT, 'commands');
  ensureDir(targetCommandsRoot);

  const files = fs.readdirSync(sourceCommandsRoot).filter(name => name.endsWith('.md'));
  for (const name of files) {
    const sourceFile = path.join(sourceCommandsRoot, name);
    const content = readText(sourceFile);
    const fm = extractFrontmatter(content) || {};
    const body = stripFrontmatter(content);
    const linkedSkill = parseSkillCall(content);
    const baseName = name.replace(/\.md$/, '');

    const targetFm = {
      name: (fm.name || baseName).replace(':', '-'),
      description: fm.description || `Command workflow for ${baseName}`,
      'argument-hint': fm['argument-hint'] || undefined
    };

    const lines = [];
    lines.push(`# Copilot Command: /${baseName}`);
    lines.push('');
    lines.push('- Generated from Claude command file.');
    if (linkedSkill) {
      lines.push(`- Primary skill: \`/${linkedSkill}\`.`);
    } else {
      lines.push('- Primary skill: infer from command purpose and invoke matching Copilot skill.');
    }
    lines.push('');
    lines.push('## Execution Instructions');
    lines.push('');
    lines.push('1. Parse arguments according to `argument-hint` if present.');
    lines.push('2. Run the mapped skill workflow and preserve all task/spec constraints.');
    lines.push('3. If user confirmation is required, ask directly and wait for response.');
    lines.push('4. Preserve structured `RESULT:` output lines when present in skill contracts.');
    lines.push('');
    lines.push('## Source Body (for compatibility)');
    lines.push('');
    lines.push(body.trim());
    lines.push('');

    writeText(path.join(targetCommandsRoot, name), `${buildFrontmatter(targetFm)}\n${lines.join('\n')}`);
  }
}

function migrateHooks() {
  const srcHooksRoot = path.join(ROOT, 'hooks');
  const dstHooksRoot = path.join(OUTPUT_ROOT, 'hooks');
  ensureDir(dstHooksRoot);

  const filesToCopy = [
    'session-start.sh',
    'check-commit-alignment.sh',
    'validate-agent-output.sh',
    'pre-compact.sh',
    'run-hook.cmd',
    'runtime.sh'
  ];

  for (const name of filesToCopy) {
    const src = path.join(srcHooksRoot, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dstHooksRoot, name));
    }
  }

  const hooksConfig = {
    version: 1,
    hooks: {
      sessionStart: [
        {
          type: 'command',
          bash: './hooks/session-start.sh',
          powershell: '.\\hooks\\run-hook.cmd session-start.sh',
          env: { GROUNDWORK_RUNTIME: 'copilot' },
          timeoutSec: 15
        }
      ],
      postToolUse: [
        {
          type: 'command',
          bash: './hooks/check-commit-alignment.sh',
          powershell: '.\\hooks\\run-hook.cmd check-commit-alignment.sh',
          env: { GROUNDWORK_RUNTIME: 'copilot' },
          timeoutSec: 10
        },
        {
          type: 'command',
          bash: './hooks/validate-agent-output.sh',
          powershell: '.\\hooks\\run-hook.cmd validate-agent-output.sh',
          env: { GROUNDWORK_RUNTIME: 'copilot' },
          timeoutSec: 10
        }
      ],
      sessionEnd: [
        {
          type: 'command',
          bash: './hooks/pre-compact.sh',
          powershell: '.\\hooks\\run-hook.cmd pre-compact.sh',
          env: { GROUNDWORK_RUNTIME: 'copilot' },
          timeoutSec: 10
        }
      ]
    }
  };

  writeText(path.join(OUTPUT_ROOT, 'hooks.json'), `${JSON.stringify(hooksConfig, null, 2)}\n`);
}

function writeCopilotManifest() {
  const sourceManifest = JSON.parse(readText(SOURCE_PLUGIN_MANIFEST));
  const rootManifest = {
    name: sourceManifest.name,
    description: sourceManifest.description,
    version: sourceManifest.version,
    author: sourceManifest.author,
    license: sourceManifest.license,
    homepage: sourceManifest.homepage,
    repository: sourceManifest.repository,
    keywords: sourceManifest.keywords || [],
    agents: 'copilot/agents/',
    skills: 'copilot/skills/',
    commands: 'copilot/commands/',
    hooks: 'copilot/hooks.json'
  };

  const packagedManifest = {
    ...rootManifest,
    agents: 'agents/',
    skills: 'skills/',
    commands: 'commands/',
    hooks: 'hooks.json'
  };

  writeText(path.join(ROOT, 'plugin.json'), `${JSON.stringify(rootManifest, null, 2)}\n`);
  writeText(path.join(OUTPUT_ROOT, 'plugin.json'), `${JSON.stringify(packagedManifest, null, 2)}\n`);
}

function writeCopilotReadme() {
  const content = `# Groundwork Copilot Plugin Assets

This directory is generated from the Claude-oriented source assets in this repository.

Generated content:

- \`agents/*.agent.md\` from \`agents/*/AGENT.md\`
- \`skills/*/SKILL.md\` from \`skills/*/SKILL.md\`
- \`commands/*.md\` from \`commands/*.md\`
- \`hooks.json\` and \`hooks/*\` from \`hooks/*\`

Regenerate after source changes:

\`\`\`bash
node tools/generate-copilot-assets.js
\`\`\`
`;
  writeText(path.join(OUTPUT_ROOT, 'README.md'), content);
}

function main() {
  cleanDir(OUTPUT_ROOT);
  migrateAgents();
  migrateSkills();
  migrateCommands();
  migrateHooks();
  writeCopilotManifest();
  writeCopilotReadme();
  console.log('Generated Copilot assets in copilot/.');
}

if (require.main === module) {
  main();
}
