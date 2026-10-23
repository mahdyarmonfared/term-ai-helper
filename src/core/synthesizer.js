/**
 * term-ai-helper - Natural Language Command Synthesizer Engine
 */

const { PATTERNS } = require('./knowledge');
const { evaluateRisk } = require('./risk');
const { explainCommand } = require('./explainer');

/**
 * Synthesizes a natural language query into concrete shell commands.
 * @param {string} query
 * @param {{ shell?: 'pwsh'|'bash'|'cmd', os?: string }} [options]
 */
function synthesizeCommand(query, options = {}) {
  const targetShell = options.shell || 'pwsh';
  const cleanQuery = (query || '').trim();

  if (!cleanQuery) {
    return {
      success: false,
      error: 'Query string cannot be empty.'
    };
  }

  // 1. Direct Pattern Matching from Knowledge Base
  for (const item of PATTERNS) {
    const match = cleanQuery.match(item.match);
    if (match) {
      const context = item.extract ? item.extract(match) : {};

      const resolveCmd = (shellKey) => {
        const cmdDef = item.commands[shellKey] || item.commands.pwsh || item.commands.bash;
        return typeof cmdDef === 'function' ? cmdDef(context) : cmdDef;
      };

      const selectedCommand = resolveCmd(targetShell);
      const computedRisk = evaluateRisk(selectedCommand);
      const risk = item.risk ? {
        level: item.risk,
        score: item.risk === 'dangerous' ? 95 : item.risk === 'caution' ? 55 : 10,
        reason: item.description || computedRisk.reason
      } : computedRisk;
      const breakdown = explainCommand(selectedCommand);

      return {
        success: true,
        patternId: item.id,
        query: cleanQuery,
        targetShell,
        command: selectedCommand,
        description: item.description,
        risk,
        breakdown,
        alternatives: {
          bash: resolveCmd('bash'),
          pwsh: resolveCmd('pwsh'),
          cmd: resolveCmd('cmd')
        }
      };
    }
  }

  // 2. Fallback Heuristic Matcher
  const fallback = generateHeuristic(cleanQuery, targetShell);
  if (fallback) {
    const risk = evaluateRisk(fallback.command);
    const breakdown = explainCommand(fallback.command);
    return {
      success: true,
      patternId: 'heuristic_fallback',
      query: cleanQuery,
      targetShell,
      command: fallback.command,
      description: fallback.description,
      risk,
      breakdown,
      alternatives: fallback.alternatives
    };
  }

  return {
    success: false,
    query: cleanQuery,
    targetShell,
    error: `Could not synthesize a deterministic command for: "${cleanQuery}". Try rephrasing with specific actions (e.g., "kill port 3000", "undo last commit", "find files larger than 50mb").`
  };
}

/**
 * Heuristic generator for unrecognized queries
 */
function generateHeuristic(query, shell) {
  const q = query.toLowerCase();

  // Git status / changes check
  if (q.includes('status') || q.includes('changes')) {
    return {
      command: 'git status',
      description: 'Displays the state of the working directory and staging area.',
      alternatives: { bash: 'git status', pwsh: 'git status', cmd: 'git status' }
    };
  }

  // Git log
  if (q.includes('history') || q.includes('commits') || q.includes('log')) {
    return {
      command: 'git log --oneline -n 10',
      description: 'Shows the 10 most recent commits in compact single-line format.',
      alternatives: {
        bash: 'git log --oneline -n 10',
        pwsh: 'git log --oneline -n 10',
        cmd: 'git log --oneline -n 10'
      }
    };
  }

  // Port search
  const portMatch = q.match(/\b([0-9]{2,5})\b/);
  if (q.includes('port') && portMatch) {
    const port = portMatch[1];
    return {
      command: shell === 'pwsh'
        ? `Get-NetTCPConnection -LocalPort ${port}`
        : shell === 'bash' ? `lsof -i :${port}` : `netstat -ano | findstr :${port}`,
      description: `Inspects open network sockets on port ${port}.`,
      alternatives: {
        bash: `lsof -i :${port}`,
        pwsh: `Get-NetTCPConnection -LocalPort ${port}`,
        cmd: `netstat -ano | findstr :${port}`
      }
    };
  }

  return null;
}

module.exports = {
  synthesizeCommand
};
