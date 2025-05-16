import type { CommandModule } from 'yargs';
import { updateTable, withSpinner } from '../lib/ui.js';
import { getUpdates } from '../api/default/default.js';
import { getConfig } from '../lib/config.js';

export const listCommand: CommandModule = {
  command: 'list',
  describe: 'List all updates',
  aliases: ['ls'],
  async handler() {
    const { projectID } = getConfig();
    const { data: updates } = await withSpinner(
      getUpdates(projectID),
      'Fetching updates...'
    );

    console.log(updateTable(updates));
  },
};
