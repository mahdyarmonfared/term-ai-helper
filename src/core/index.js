/**
 * term-ai-helper - Core Module Aggregator
 */

const { synthesizeCommand } = require('./synthesizer');
const { evaluateRisk } = require('./risk');
const { explainCommand, FLAG_DICTIONARY } = require('./explainer');
const { PATTERNS } = require('./knowledge');

module.exports = {
  synthesizeCommand,
  evaluateRisk,
  explainCommand,
  FLAG_DICTIONARY,
  PATTERNS
};
