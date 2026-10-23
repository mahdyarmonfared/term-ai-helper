/**
 * term-ai-helper - Command Safety & Risk Engine
 * Analyzes terminal commands against destructive patterns and calculates risk level.
 */

const DANGEROUS_PATTERNS = [
  /\brm\s+-[a-zA-Z]*r[a-zA-Z]*f?\s+[\/~]/i,
  /\brm\s+-[a-zA-Z]*f[a-zA-Z]*r?\s+[\/~]/i,
  /\brm\s+-rf\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bformat\s+[a-zA-Z]:/i,
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, // fork bomb
  /\bRemove-Item\b.*-Recurse.*-Force/i,
  /\bdel\s+\/[fF]\s+\/[sS]\s+\/[qQ]\s+[a-zA-Z]:\\/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-[a-zA-Z]*f/i,
  /\b(DROP|TRUNCATE)\s+(DATABASE|TABLE)\b/i,
  /\bchmod\s+(-R\s+)?777\s+\//i
];

const CAUTION_PATTERNS = [
  /\bkill\b/i,
  /\bpkill\b/i,
  /\bStop-Process\b/i,
  /\btaskkill\b/i,
  /\bfuser\s+-k/i,
  /\bdocker\s+(container\s+)?(rm|prune)\b/i,
  /\bdocker\s+image\s+(rm|prune)\b/i,
  /\bgit\s+push\b.*(--force|-f)\b/i,
  /\bgit\s+branch\s+-[dD]\b/i,
  /\bgit\s+restore\b/i,
  /\bgit\s+stash\s+drop\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bmv\b/i,
  /\bMove-Item\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i
];

/**
 * Evaluates the execution risk of a shell command string.
 * @param {string} command
 * @returns {{ level: 'safe'|'caution'|'dangerous', score: number, reason: string }}
 */
function evaluateRisk(command) {
  if (typeof command !== 'string' || !command.trim()) {
    return { level: 'safe', score: 0, reason: 'Empty command.' };
  }

  const cmd = command.trim();

  // 1. Check Destructive / Dangerous
  for (const pat of DANGEROUS_PATTERNS) {
    if (pat.test(cmd)) {
      return {
        level: 'dangerous',
        score: 95,
        reason: 'Command carries potential for irrecoverable data loss, disk destruction, or irreversible resets.'
      };
    }
  }

  // 2. Check Caution / Modifying
  for (const pat of CAUTION_PATTERNS) {
    if (pat.test(cmd)) {
      return {
        level: 'caution',
        score: 55,
        reason: 'Command alters system state, stops running processes, or modifies repository history.'
      };
    }
  }

  // 3. Default Safe / Read-Only
  return {
    level: 'safe',
    score: 10,
    reason: 'Read-only, diagnostic, or non-destructive routine command.'
  };
}

module.exports = {
  evaluateRisk,
  DANGEROUS_PATTERNS,
  CAUTION_PATTERNS
};
