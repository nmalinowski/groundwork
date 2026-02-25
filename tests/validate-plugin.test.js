/**
 * Tests for lib/validate-plugin.js
 *
 * Run with: node tests/validate-plugin.test.js
 */

const path = require('path');
const assert = require('assert');
const { runValidation, printValidationResults } = require('../lib/validate-plugin');

const PLUGIN_ROOT = path.resolve(__dirname, '..');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.message}`);
    failed++;
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function runValidator() {
  const result = runValidation();
  return {
    result,
    output: captureOutput(() => printValidationResults(result))
  };
}

function captureOutput(fn) {
  const logs = [];
  const original = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = original;
  }
  return logs.join('\n');
}

// Tests
describe('validate-plugin.js', () => {
  test('runs without crashing', () => {
    runValidator();
  });

  test('produces output', () => {
    const { output } = runValidator();

    assert.ok(output.includes('Validating'), 'Should show validation message');
  });

  test('checks skills directory', () => {
    const { output } = runValidator();

    // If there are errors, they would be in output
    // If not, "All checks passed" should appear
    assert.ok(
      output.includes('passed') || output.includes('error') || output.includes('warning'),
      'Should produce a result'
    );
  });

  test('validates copilot migration assets', () => {
    const { output } = runValidator();

    assert.ok(!output.includes('Missing copilot component path'), 'Copilot component paths should be present');
    assert.ok(!output.includes('Referenced path not found'), 'Copilot referenced paths should exist');
  });
});

describe('skill validation rules', () => {
  test('all skills have valid frontmatter', () => {
    const { output } = runValidator();

    // Check no "Missing or invalid YAML frontmatter" errors
    assert.ok(
      !output.includes('Missing or invalid YAML frontmatter'),
      'All skills should have valid frontmatter'
    );
  });

  test('all skills have name field', () => {
    const { output } = runValidator();

    assert.ok(
      !output.includes('Missing required field: name'),
      'All skills should have name field'
    );
  });

  test('all skills have description field', () => {
    const { output } = runValidator();

    assert.ok(
      !output.includes('Missing required field: description'),
      'All skills should have description field'
    );
  });
});

// Summary
console.log(`\n${'='.repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
