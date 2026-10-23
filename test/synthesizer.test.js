const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { synthesizeCommand } = require('../src/core/synthesizer');

describe('term-ai-helper - Synthesizer Engine', () => {
  it('should synthesize kill port command for pwsh and bash', () => {
    const pwshRes = synthesizeCommand('kill process on port 8080', { shell: 'pwsh' });
    assert.equal(pwshRes.success, true);
    assert.equal(pwshRes.command.includes('8080'), true);
    assert.equal(pwshRes.command.includes('Stop-Process'), true);

    const bashRes = synthesizeCommand('kill process on port 8080', { shell: 'bash' });
    assert.equal(bashRes.success, true);
    assert.equal(bashRes.command.includes('8080'), true);
    assert.equal(bashRes.command.includes('fuser') || bashRes.command.includes('lsof'), true);
  });

  it('should synthesize undo commit keeping changes', () => {
    const res = synthesizeCommand('undo last commit keeping files');
    assert.equal(res.success, true);
    assert.equal(res.command.includes('git reset --soft HEAD~1'), true);
    assert.equal(res.risk.level, 'caution');
  });

  it('should synthesize undo commit and delete changes as dangerous', () => {
    const res = synthesizeCommand('undo last commit and discard changes');
    assert.equal(res.success, true);
    assert.equal(res.command.includes('git reset --hard HEAD~1'), true);
    assert.equal(res.risk.level, 'dangerous');
  });

  it('should synthesize find large files with slot extraction', () => {
    const res = synthesizeCommand('find files larger than 50mb', { shell: 'bash' });
    assert.equal(res.success, true);
    assert.equal(res.command.includes('find . -type f -size +50M'), true);
    assert.equal(res.risk.level, 'safe');
  });

  it('should handle empty or whitespace query gracefully', () => {
    const res = synthesizeCommand('   ');
    assert.equal(res.success, false);
    assert.equal(typeof res.error, 'string');
  });

  it('should provide fallback heuristic for git status', () => {
    const res = synthesizeCommand('show git status changes');
    assert.equal(res.success, true);
    assert.equal(res.command, 'git status');
  });
});
