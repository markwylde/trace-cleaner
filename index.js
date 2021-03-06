const chain = require('stack-chain');
const chalk = require('chalk');
const path = require('path');

global.Error = class extends Error {
  constructor (message) {
    super(message);
    this.stack += '';
  }
};

const originalCaptureStackTrace = global.Error.captureStackTrace;
global.Error.captureStackTrace = (...args) => {
  if (args[0].constructor.name === 'Object') {
    originalCaptureStackTrace(...args);
  }
};

const appDir = require.main
  ? path.dirname(require.main.filename) + '/'
  : path.dirname(process.argv[1]);

chain.filter.attach(function (error, frames) {
  if (!frames || !frames.filter) {
    return frames;
  }

  return frames.filter(function (callSite) {
    const name = callSite && callSite.getFileName();
    return (name && name.includes(path.sep) && !name.startsWith('internal'));
  });
});

chain.format.replace(function (error, frames) {
  const lines = [];

  lines.push(error.toString());

  for (let i = 0; i < frames.length; i++) {
    let frame = '    at ' + frames[i];

    if (!frame.includes('node_modules')) {
      if (appDir) {
        frame = frame.split(appDir);
        if (frame[1]) {
          frame[1] = chalk.bold(frame[1].slice(0, -1));
        }
        frame = frame.join(appDir) + ')';

        frame = frame.replace(appDir, chalk.grey(appDir));
      }
      lines.push(frame);
    } else {
      lines.push(chalk.grey(frame));
    }
  }

  return lines.join('\n');
});
