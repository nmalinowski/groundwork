const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { extractFrontmatter: parseFrontmatter, stripFrontmatter } = require('./frontmatter');

/**
 * Extract YAML frontmatter from a skill file.
 * Current format:
 * ---
 * name: skill-name
 * description: Use when [condition] - [what it does]
 * requires: [optional] comma-separated list of required skill names
 * ---
 *
 * @param {string} filePath - Path to SKILL.md file
 * @returns {{name: string, description: string, requires: string[]}}
 */
function extractFrontmatter(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fm = parseFrontmatter(content);

        if (!fm) {
            return { name: '', description: '', requires: [] };
        }

        // 'requires' is already normalized to an array by frontmatter.js
        return {
            name: fm.name || '',
            description: fm.description || '',
            requires: fm.requires || []
        };
    } catch (error) {
        if (process.env.GROUNDWORK_DEBUG) {
            console.error(`[groundwork] Error reading skill ${filePath}: ${error.message}`);
        }
        return { name: '', description: '', requires: [] };
    }
}

/**
 * Find all SKILL.md files in a directory recursively.
 *
 * @param {string} dir - Directory to search
 * @param {string} sourceType - 'personal' or 'groundwork' for namespacing
 * @param {number} maxDepth - Maximum recursion depth (default: 3)
 * @returns {Array<{path: string, name: string, description: string, sourceType: string}>}
 */
function findSkillsInDir(dir, sourceType, maxDepth = 3) {
    const skills = [];

    if (!fs.existsSync(dir)) return skills;

    function recurse(currentDir, depth) {
        if (depth > maxDepth) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // Check for SKILL.md in this directory
                const skillFile = path.join(fullPath, 'SKILL.md');
                if (fs.existsSync(skillFile)) {
                    const { name, description, requires } = extractFrontmatter(skillFile);
                    skills.push({
                        path: fullPath,
                        skillFile: skillFile,
                        name: name || entry.name,
                        description: description || '',
                        requires: requires || [],
                        sourceType: sourceType
                    });
                }

                // Recurse into subdirectories
                recurse(fullPath, depth + 1);
            }
        }
    }

    recurse(dir, 0);
    return skills;
}

/**
 * Discover default skill roots for the current runtime.
 *
 * Priority order:
 * 1. Explicit env overrides
 * 2. Plugin-local skills directories
 * 3. User home skills directories
 */
function getDefaultSkillRoots(pluginRoot = path.resolve(__dirname, '..')) {
    const roots = [];
    const runtime = (process.env.GROUNDWORK_RUNTIME || '').toLowerCase();

    if (process.env.GROUNDWORK_SKILLS_DIR) {
        roots.push(process.env.GROUNDWORK_SKILLS_DIR);
    }

    const localCandidates = [
        path.join(pluginRoot, 'skills'),
        path.join(pluginRoot, 'copilot', 'skills'),
        path.join(pluginRoot, '.github', 'skills')
    ];
    roots.push(...localCandidates);

    const home = process.env.HOME || process.env.USERPROFILE || '';
    if (home) {
        // Personal skills used by Claude and Copilot installations
        roots.push(path.join(home, '.claude', 'skills'));
        roots.push(path.join(home, '.copilot', 'skills'));
    }

    // Prefer copilot roots first when runtime is explicitly copilot.
    if (runtime === 'copilot') {
        roots.sort((a, b) => {
            const ac = a.includes('.copilot') || a.includes(path.join('copilot', 'skills'));
            const bc = b.includes('.copilot') || b.includes(path.join('copilot', 'skills'));
            if (ac === bc) return 0;
            return ac ? -1 : 1;
        });
    }

    // Keep only existing unique paths.
    return Array.from(new Set(roots.filter(p => p && fs.existsSync(p))));
}

/**
 * Resolve a skill name to its file path, handling shadowing
 * (personal skills override groundwork skills).
 *
 * @param {string} skillName - Name like "groundwork:brainstorming" or "my-skill"
 * @param {string} groundworkDir - Path to groundwork skills directory
 * @param {string} personalDir - Path to personal skills directory
 * @returns {{skillFile: string, sourceType: string, skillPath: string} | null}
 */
function resolveSkillPath(skillName, groundworkDir, personalDir) {
    // Strip groundwork: prefix if present
    const forceGroundwork = skillName.startsWith('groundwork:');
    const actualSkillName = forceGroundwork ? skillName.replace(/^groundwork:/, '') : skillName;

    // Try personal skills first (unless explicitly groundwork:)
    if (!forceGroundwork && personalDir) {
        const personalPath = path.join(personalDir, actualSkillName);
        const personalSkillFile = path.join(personalPath, 'SKILL.md');
        if (fs.existsSync(personalSkillFile)) {
            return {
                skillFile: personalSkillFile,
                sourceType: 'personal',
                skillPath: actualSkillName
            };
        }
    }

    // Try groundwork skills
    if (groundworkDir) {
        const groundworkPath = path.join(groundworkDir, actualSkillName);
        const groundworkSkillFile = path.join(groundworkPath, 'SKILL.md');
        if (fs.existsSync(groundworkSkillFile)) {
            return {
                skillFile: groundworkSkillFile,
                sourceType: 'groundwork',
                skillPath: actualSkillName
            };
        }
    }

    return null;
}

/**
 * Check if a git repository has updates available.
 *
 * @param {string} repoDir - Path to git repository
 * @returns {boolean} - True if updates are available
 */
function checkForUpdates(repoDir) {
    try {
        // Quick check with 3 second timeout to avoid delays if network is down
        const output = execSync('git fetch origin && git status --porcelain=v1 --branch', {
            cwd: repoDir,
            timeout: 3000,
            encoding: 'utf8',
            stdio: 'pipe'
        });

        // Parse git status output to see if we're behind
        const statusLines = output.split('\n');
        for (const line of statusLines) {
            if (line.startsWith('## ') && line.includes('[behind ')) {
                return true; // We're behind remote
            }
        }
        return false; // Up to date
    } catch (error) {
        // Network down, git error, timeout, etc. - don't block bootstrap
        return false;
    }
}

module.exports = {
    extractFrontmatter,
    findSkillsInDir,
    getDefaultSkillRoots,
    resolveSkillPath,
    checkForUpdates,
    stripFrontmatter
};
