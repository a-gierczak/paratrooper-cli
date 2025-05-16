import resolveFrom from 'resolve-from';
import { debug as makeLogger } from 'debug';

const debug = makeLogger(`ota:expo`);

export const resolveExpoCli = (projectDir: string) => {
  let maybeExpoCliPath: string | undefined;

  for (const path of ['expo/bin/cli', 'expo/bin/cli.js']) {
    try {
      maybeExpoCliPath = resolveFrom(projectDir, path);
    } catch (error) {}
  }

  if (!maybeExpoCliPath) {
    throw new Error(
      `Expo CLI is not installed. Project directory: ${projectDir}`
    );
  }

  const expoCliPath = maybeExpoCliPath;
  debug('Found Expo CLI at path: %s', expoCliPath);

  return expoCliPath;
};
