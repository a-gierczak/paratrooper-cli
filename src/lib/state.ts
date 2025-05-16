import path from 'node:path';
import fs from 'node:fs/promises';
import { debug as makeLogger } from 'debug';

const debug = makeLogger('ota:state');

export class StateFile {
  private path: string;

  constructor(dataDir: string) {
    this.path = path.join(dataDir, 'state.json');
  }

  private async ensureFileExists() {
    let canAccess = false;

    try {
      await fs.access(this.path, fs.constants.R_OK | fs.constants.W_OK);
      canAccess = true;
    } catch {}

    if (canAccess) {
      return;
    }

    try {
      await fs.mkdir(path.dirname(this.path), { recursive: true });
      await fs.writeFile(this.path, JSON.stringify({}), { encoding: 'utf-8' });
    } catch (error) {
      debug('Failed to create state file');
      throw error;
    }
  }

  public async read() {
    await this.ensureFileExists();

    try {
      const json = await fs.readFile(this.path, { encoding: 'utf-8' });
      const data = JSON.parse(json) as Record<string, unknown>;
      return data;
    } catch (error) {
      debug('Failed to parse state file, removing it');
      await fs.rm(this.path);
      return {};
    }
  }

  public async set(key: string, value: unknown) {
    const data = await this.read();
    data[key] = value;
    await fs.writeFile(this.path, JSON.stringify(data));
  }
}
