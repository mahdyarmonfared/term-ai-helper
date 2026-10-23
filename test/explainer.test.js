const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { explainCommand } = require('../src/core/explainer');

describe('term-ai-helper - Command Explainer', () => {
  it('should decompose simple program and arguments', () => {
    const tokens = explainCommand('git status');
    assert.equal(tokens.length, 2);
    assert.equal(tokens[0].type, 'program');
    assert.equal(tokens[0].token, 'git');
    assert.equal(tokens[1].type, 'subcommand');
    assert.equal(tokens[1].token, 'status');
  });

  it('should identify flags and describe them', () => {
    const tokens = explainCommand('tar -czvf backup.tar.gz src');
    assert.equal(tokens[0].type, 'program');
    assert.equal(tokens[1].type, 'flag');
    assert.equal(tokens[2].type, 'argument');
  });

  it('should identify pipe operators', () => {
    const tokens = explainCommand('ps aux | grep node');
    const pipe = tokens.find(t => t.type === 'operator');
    assert.ok(pipe);
    assert.equal(pipe.token, '|');
  });
});
