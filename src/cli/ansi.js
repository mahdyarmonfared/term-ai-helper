/**
 * Zero-dependency ANSI styling helper
 */

const isColorSupported = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR);

function wrap(code, close = 39) {
  return (str) => (isColorSupported ? `\x1b[${code}m${str}\x1b[${close}m` : String(str));
}

module.exports = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  italic: wrap(3, 23),
  underline: wrap(4, 24),
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
  gray: wrap(90),
  bgRed: wrap(41, 49),
  bgGreen: wrap(42, 49),
  bgYellow: wrap(43, 49),
  bgBlue: wrap(44, 49)
};
