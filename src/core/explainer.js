/**
 * term-ai-helper - Command Explainer & Token Inspector
 * Deconstructs shell command lines into parsed tokens with plain-English annotations.
 */

const FLAG_DICTIONARY = {
  '-f': 'Forces operation without interactive prompt or confirmation.',
  '--force': 'Forces execution, bypassing standard safety guards.',
  '-r': 'Recursively applies the command across directories and subdirectories.',
  '-R': 'Recursive directory traversal mode.',
  '--recursive': 'Recurse into child directories.',
  '-a': 'All entries, including hidden dotfiles or inactive records.',
  '-l': 'Long detailed listing format (permissions, ownership, size, timestamp).',
  '-h': 'Human-readable sizes (K, M, G) instead of raw byte counts.',
  '-p': 'Preserves file attributes, or creates parent directories as needed.',
  '--soft': 'Keeps files staged in Git index without touching the working tree.',
  '--hard': 'Discards changes in both index and working tree completely.',
  '-m': 'Commit or annotation message specification.',
  '-b': 'Creates and checks out a new Git branch.',
  '-u': 'Tracks upstream remote branch, or includes untracked files.',
  '-i': 'Interactive prompt before making destructive changes, or case-insensitive search.',
  '-n': 'Line numbers display in search results, or dry-run preview.',
  '-v': 'Verbose mode, displaying detailed progress per item processed.',
  '-q': 'Quiet mode, suppresses non-error informational messages.',
  '-s': 'Silent / script-friendly output without extra decorations.',
  '--tail': 'Limits output stream to the most recent specified number of lines.'
};

/**
 * Tokenizes and explains the components of a command line.
 * @param {string} command
 * @returns {Array<{ token: string, type: 'program'|'subcommand'|'flag'|'argument'|'operator', explanation: string }>}
 */
function explainCommand(command) {
  if (typeof command !== 'string' || !command.trim()) return [];

  // Split keeping quotes intact
  const rawTokens = command.trim().match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  const results = [];

  let isFirst = true;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];

    if (token === '|' || token === '||' || token === '&&' || token === ';' || token === '>') {
      results.push({
        token,
        type: 'operator',
        explanation: `Shell flow control operator (${token}) sequencing multiple commands.`
      });
      isFirst = true;
      continue;
    }

    if (isFirst) {
      results.push({
        token,
        type: 'program',
        explanation: `Main executable or built-in shell utility: ${token}`
      });
      isFirst = false;
      continue;
    }

    if (token.startsWith('--') || token.startsWith('-')) {
      const cleanFlag = token.split('=')[0];
      const found = FLAG_DICTIONARY[cleanFlag] || `Shell flag/parameter to configure behavior of the preceding utility.`;
      results.push({
        token,
        type: 'flag',
        explanation: found
      });
      continue;
    }

    // Check if token looks like git subcommand or docker subcommand
    if (i === 1 && /^(status|log|diff|push|pull|fetch|clone|reset|commit|checkout|branch|restore|clean|stash|prune|container|image|logs)$/i.test(token)) {
      results.push({
        token,
        type: 'subcommand',
        explanation: `Subcommand specifying the action scope: "${token}".`
      });
      continue;
    }

    results.push({
      token,
      type: 'argument',
      explanation: `Target path, branch name, port, or operand: "${token.replace(/^["']|["']$/g, '')}".`
    });
  }

  return results;
}

module.exports = {
  explainCommand,
  FLAG_DICTIONARY
};
