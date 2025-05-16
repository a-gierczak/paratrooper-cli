import path from 'node:path';
import fs from 'node:fs';
import { MiddlewareFunction } from 'yargs';
import { isValidProtocol } from './protocol';
import { UpdateProtocol } from '../api/model';

export const CONFIG_FILE_NAME = 'paratrooper.json';

export const getConfigFilePath = () => {
  return path.resolve(process.cwd(), CONFIG_FILE_NAME);
};

export interface Config {
  apiBaseUrl: string;
  protocol: UpdateProtocol;
  projectID: string;
}

let config: Config = {} as Config;

export const getConfig = () => config;

export const setApiBaseUrl = (apiBaseUrl: string) => {
  config.apiBaseUrl = apiBaseUrl;
};

export const readConfig: MiddlewareFunction = (args) => {
  if (args._[0] === 'init') {
    return;
  }

  if (!fs.existsSync(getConfigFilePath())) {
    console.error(
      `Paratrooper CLI is not initialized. Run '${args.$0} init' to initialize it.`
    );
    process.exit(1);
  }

  const content = fs.readFileSync(getConfigFilePath(), 'utf-8');
  config = JSON.parse(content) as Config;

  const validBaseUrl =
    typeof config.apiBaseUrl === 'string' && config.apiBaseUrl;
  const validProtocol = isValidProtocol(config.protocol);
  const validProjectID =
    typeof config.projectID === 'string' && config.projectID;
  if (!validBaseUrl || !validProtocol || !validProjectID) {
    console.error(
      `Invalid configuration file. Delete ${CONFIG_FILE_NAME} and run '${args.$0} init' to initialize the CLI again.`
    );
    process.exit(1);
  }
};
