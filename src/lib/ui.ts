import chalk from 'chalk';
import ora, { Ora } from 'ora-classic';
import { UpdateStatus } from '../api/model/updateStatus';
import { Update } from '../api/model/update';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { table } from 'table';

let _spinner: Ora | null = null;

export const spinner = (text: string) => {
  if (_spinner) {
    _spinner.stop();
  }

  _spinner = ora(text).start();
};

export const stopSpinner = () => {
  if (_spinner) {
    _spinner.stop();
  }
};

export const withSpinner = async <T>(promise: Promise<T>, text: string) => {
  ora.promise(promise, text);
  return promise;
};

export const updateTable = (updates: Update[]) => {
  const getStatusColor = (status: UpdateStatus) => {
    switch (status) {
      case 'processing':
        return chalk.gray(status);
      case 'published':
        return chalk.green(status);
      case 'failed':
        return chalk.red(status);
      case 'pending':
        return chalk.yellow(status);
      case 'canceled':
        return chalk.grey.dim(status);
      default:
        return status;
    }
  };

  const formatDate = (date: string) => {
    const dateObj = new Date(date);

    if (isToday(dateObj)) {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    }

    return format(dateObj, 'yyyy/MM/dd HH:mm');
  };

  const headers = ['ID', 'Channel', 'Version', 'Created', 'Message', 'Status'];

  const rows = updates.map((update) => [
    update.id,
    update.channel,
    update.runtimeVersion,
    formatDate(update.createdAt),
    update.message,
    getStatusColor(update.status),
  ]);

  return table([headers, ...rows]);
};
