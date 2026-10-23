const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateRisk } = require('../src/core/risk');

describe('term-ai-helper - Risk Analyzer', () => {
  it('should flag rm -rf / as dangerous', () => {
    const risk = evaluateRisk('rm -rf /');
    assert.equal(risk.level, 'dangerous');
    assert.equal(risk.score >= 90, true);
  });

  it('should flag git reset --hard as dangerous', () => {
    const risk = evaluateRisk('git reset --hard HEAD~1');
    assert.equal(risk.level, 'dangerous');
  });

  it('should flag Remove-Item -Recurse -Force as dangerous', () => {
    const risk = evaluateRisk('Remove-Item C:\\test -Recurse -Force');
    assert.equal(risk.level, 'dangerous');
  });

  it('should flag kill or pkill as caution', () => {
    const risk = evaluateRisk('kill -9 1234');
    assert.equal(risk.level, 'caution');
  });

  it('should flag git push --force as caution', () => {
    const risk = evaluateRisk('git push origin main --force');
    assert.equal(risk.level, 'caution');
  });

  it('should evaluate read-only queries as safe', () => {
    const risk1 = evaluateRisk('git status');
    assert.equal(risk1.level, 'safe');

    const risk2 = evaluateRisk('Get-ChildItem -Recurse');
    assert.equal(risk2.level, 'safe');

    const risk3 = evaluateRisk('curl https://api.github.com');
    assert.equal(risk3.level, 'safe');
  });
});
