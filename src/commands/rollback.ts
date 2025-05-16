import { confirm } from '@inquirer/prompts';
import type { CommandModule } from 'yargs';
import { getUpdate, rollbackUpdate } from '../api/default/default.js';
import { UpdateStatus } from '../api/model/index.js';
import { updateTable, withSpinner } from '../lib/ui.js';
import { getConfig } from '../lib/config.js';

interface Args {
  updateId: string;
}

export const rollbackCommand: CommandModule<unknown, Args> = {
  command: 'rollback <updateId>',
  describe: 'Rollback an update',
  async handler(args) {
    const { projectID } = getConfig();
    const { data: update } = await withSpinner(
      getUpdate(projectID, args.updateId),
      'Fetching update details'
    );

    if (update.status !== UpdateStatus.published) {
      throw new Error('Cannot rollback non-published update');
    }

    console.log(updateTable([update]));

    const confirmed = await confirm({
      message: 'Are you sure you want to rollback this update?',
      default: false,
    });
    if (!confirmed) {
      return;
    }

    await withSpinner(
      rollbackUpdate(projectID, update.id),
      'Rolling back the update'
    );

    console.log('Succesfully rolled back the update.');
  },
};
