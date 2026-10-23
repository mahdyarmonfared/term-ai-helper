/**
 * term-ai-helper - CLI Runner Engine
 */

const ansi = require('./ansi');
const { synthesizeCommand } = require('../core/index');
const { startServer } = require('../server/server');

function printHelp() {
  console.log(`
${ansi.bold(ansi.cyan('term-ai-helper'))} - Natural language to shell command generator & risk analyzer

${ansi.bold('USAGE:')}
  ${ansi.green('npx term-ai')} ${ansi.yellow('<query>')} [options]
  ${ansi.green('npx term-ai')} ${ansi.yellow('studio')} [--port 3028]

${ansi.bold('EXAMPLES:')}
  ${ansi.dim('$')} npx term-ai "kill process on port 3000"
  ${ansi.dim('$')} npx term-ai "undo last commit keeping files" --shell bash
  ${ansi.dim('$')} npx term-ai "find files larger than 100mb" --explain
  ${ansi.dim('$')} npx term-ai "docker remove stopped containers"
  ${ansi.dim('$')} npx term-ai studio --port 3028

${ansi.bold('OPTIONS:')}
  ${ansi.cyan('-s, --shell <type>')}    Target shell: pwsh (default), bash, cmd
  ${ansi.cyan('-e, --explain')}         Show breakdown of flags and operands
  ${ansi.cyan('-p, --port <number>')}   Port to run Web Studio (default: 3028)
  ${ansi.cyan('-h, --help')}            Display this help guide
  ${ansi.cyan('-v, --version')}         Print package version
`);
}

function runCli(args = process.argv.slice(2)) {
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    return;
  }

  if (args.includes('-v') || args.includes('--version')) {
    const pkg = require('../../package.json');
    console.log(`term-ai-helper v${pkg.version}`);
    return;
  }

  // Web Studio command
  if (args[0] === 'studio' || args[0] === 'ui') {
    let port = 3028;
    const portIdx = args.findIndex(a => a === '-p' || a === '--port');
    if (portIdx !== -1 && args[portIdx + 1]) {
      port = parseInt(args[portIdx + 1], 10) || 3028;
    }
    startServer({ port });
    return;
  }

  // Parse flags
  let shell = 'pwsh';
  let explain = false;
  const queryParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-s' || arg === '--shell') {
      shell = args[i + 1] || 'pwsh';
      i++;
    } else if (arg === '-e' || arg === '--explain') {
      explain = true;
    } else if (!arg.startsWith('-')) {
      queryParts.push(arg);
    }
  }

  const query = queryParts.join(' ').trim();
  if (!query) {
    console.error(ansi.red('Error: Please provide a natural language query.'));
    return;
  }

  const result = synthesizeCommand(query, { shell });

  if (!result.success) {
    console.log(`\n${ansi.red('✖ ' + result.error)}\n`);
    return;
  }

  // Render Result Card
  console.log(`\n${ansi.bold(ansi.cyan('─── Term-AI Command Synthesizer ───'))}`);
  console.log(`${ansi.bold('Query:')} ${ansi.dim(result.query)}`);
  console.log(`${ansi.bold('Target Shell:')} ${ansi.yellow(result.targetShell.toUpperCase())}`);

  // Risk Badge
  let riskBadge = ansi.bgGreen(ansi.bold(' SAFE '));
  if (result.risk.level === 'caution') {
    riskBadge = ansi.bgYellow(ansi.bold(' CAUTION '));
  } else if (result.risk.level === 'dangerous') {
    riskBadge = ansi.bgRed(ansi.bold(' DANGEROUS '));
  }

  console.log(`${ansi.bold('Safety Level:')} ${riskBadge} ${ansi.dim(result.risk.reason)}`);
  console.log(`\n${ansi.bold(ansi.green('Synthesized Command:'))}`);
  console.log(`  ${ansi.bold(ansi.yellow(result.command))}\n`);
  console.log(`${ansi.dim('Description:')} ${result.description}`);

  // Cross-platform alternatives
  if (result.alternatives) {
    console.log(`\n${ansi.bold('Cross-Platform Syntax:')}`);
    if (result.alternatives.pwsh && result.targetShell !== 'pwsh') {
      console.log(`  ${ansi.cyan('PowerShell:')} ${result.alternatives.pwsh}`);
    }
    if (result.alternatives.bash && result.targetShell !== 'bash') {
      console.log(`  ${ansi.cyan('Bash/Zsh:')}   ${result.alternatives.bash}`);
    }
    if (result.alternatives.cmd && result.targetShell !== 'cmd') {
      console.log(`  ${ansi.cyan('CMD:')}        ${result.alternatives.cmd}`);
    }
  }

  if (explain && result.breakdown && result.breakdown.length > 0) {
    console.log(`\n${ansi.bold('Token & Flag Breakdown:')}`);
    for (const item of result.breakdown) {
      console.log(`  ${ansi.yellow(item.token.padEnd(16))} ${ansi.dim(`[${item.type}]`)} ${item.explanation}`);
    }
  }
  console.log('');
}

module.exports = {
  runCli,
  printHelp
};
