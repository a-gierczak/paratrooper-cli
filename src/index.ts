import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import { listCommand } from './commands/list.js';
import { updateCommand } from './commands/update.js';
import { rollbackCommand } from './commands/rollback.js';
import { readConfig } from './lib/config.js';
import { initCommand } from './commands/init.js';

void yargs(hideBin(process.argv))
  .middleware(readConfig, true)
  .command(initCommand)
  .command(updateCommand)
  .command(listCommand)
  .command(rollbackCommand)
  .version(false)
  .help()
  .demandCommand(1, '') // show help if no command is provided
  .strictCommands()
  .fail((msg, err, yargs) => {
    if (err instanceof Error && err.name === 'ExitPromptError') {
      process.exit(0);
    }

    if (msg) {
      console.error(msg + '\n');
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (err) {
      console.error(err);
    } else {
      yargs.showHelp('log');
    }
    process.exit(1);
  })
  .parse();
