import type { CommandModule } from 'yargs';
import {
  Config,
  CONFIG_FILE_NAME,
  getConfigFilePath,
  setApiBaseUrl,
} from '../lib/config.js';
import { existsSync, writeFileSync } from 'fs';
import { input, select } from '@inquirer/prompts';
import {
  assertPackageInstalledForProtocol,
  getProtocolName,
} from '../lib/protocol.js';
import { assertInsideNpmPackageRootDir } from '../lib/util.js';
import {
  type UpdateProtocol,
  UpdateProtocol as UpdateProtocolEnum,
} from '../api/model/updateProtocol.js';
import { createProject, getProjectByID } from '../api/default/default.js';
import { withSpinner } from '../lib/ui.js';
import { Project } from '../api/model/project.js';

export const initCommand: CommandModule = {
  command: 'init',
  describe: 'Initialize a Paratrooper project',
  async handler() {
    assertInsideNpmPackageRootDir();

    const configFilePath = getConfigFilePath();
    if (existsSync(configFilePath)) {
      console.log(
        `Paratrooper CLI is already initialized (${CONFIG_FILE_NAME} exists)`
      );
      return;
    }

    const apiBaseUrl = await input({
      message: 'Enter the URL of the Paratrooper API',
      required: true,
    });
    setApiBaseUrl(apiBaseUrl);

    const project = await getOrCreateParatrooperProject();
    assertPackageInstalledForProtocol(process.cwd(), project.updateProtocol);

    const config: Config = {
      apiBaseUrl,
      protocol: project.updateProtocol,
      projectID: project.id,
    };

    writeFileSync(configFilePath, JSON.stringify(config, null, 2));

    console.log(`Paratrooper CLI initialized 🚀`);
    console.log(`Configuration saved to ${configFilePath}`);
    console.log(
      'You now need to set up your native projects. Please follow the instructions in the docs.'
    );
  },
};

async function getOrCreateParatrooperProject(): Promise<Project> {
  const action = await select({
    message: 'Use existing Paratrooper project or create a new one?',
    choices: [
      {
        name: 'Use existing project',
        value: 'existing',
      },
      {
        name: 'Create new project',
        value: 'new',
      },
    ] as const,
  });

  if (action === 'existing') {
    const projectID = await input({
      message: 'Enter the ID of the existing project',
      required: true,
    });

    const { data: project } = await withSpinner(
      getProjectByID(projectID),
      'Fetching project'
    );

    return project;
  }

  const projectName = await input({
    message: 'Enter a name for the new project',
    required: true,
  });

  const updateProtocol = await select({
    message: 'Which update protocol does your project use?',
    choices: (Object.keys(UpdateProtocolEnum) as UpdateProtocol[]).map(
      (protocol) => ({
        name: getProtocolName(protocol),
        value: protocol,
      })
    ),
  });

  const { data: project } = await withSpinner(
    createProject({ name: projectName, updateProtocol }),
    'Creating project'
  );

  return project;
}
