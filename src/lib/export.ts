import { $ } from 'zx/core';
import path from 'node:path';
import fs from 'node:fs';
import { spinner, stopSpinner, withSpinner } from './ui';
import { debug as makeLogger } from 'debug';
import { readFileSync } from 'node:fs';
import { get } from 'lodash';
import { PrepareUpdateParams, UpdateMetadata } from '../api/model';
import { resolveExpoCli } from '../expo';
import resolveFrom from 'resolve-from';
import { input, select } from '@inquirer/prompts';
import glob from 'fast-glob';
import { resolveHermescPath, isHermesEnabled } from './react-native';
import chalk from 'chalk';

const debug = makeLogger(`ota:export`);

const platforms = ['ios', 'android'] as const;
type Platform = (typeof platforms)[number];

export const getExportOutDir = (projectDir: string) =>
  path.resolve(projectDir, 'dist');

export interface Asset {
  path: string;
  ext: string;
}

export const resolveExporter = (projectDir: string): Exporter => {
  try {
    resolveExpoCli(projectDir);
    return new ExpoExporter(projectDir);
  } catch (e) {}

  return new ReactNativeExporter(projectDir);
};

export interface Exporter {
  export: () => Promise<void>;
  resolveBundleAndAssets: () => Promise<UpdateMetadata>;
  resolveRuntimeVersion: () => Promise<string>;
  getExtraUpdateParams: () => Partial<PrepareUpdateParams>;
}

export class ExpoExporter implements Exporter {
  public expoConfig?: Record<string, unknown>;
  private readonly exportOutDir: string;
  private readonly expoCliPath: string;

  constructor(projectDir: string) {
    this.exportOutDir = getExportOutDir(projectDir);
    this.expoCliPath = resolveExpoCli(projectDir);
  }

  async export() {
    const promise = $({
      quiet: true,
    })`${this.expoCliPath} export --output-dir ${this.exportOutDir}`;

    await withSpinner(promise, 'Exporting bundles & assets');
  }

  async resolveBundleAndAssets() {
    spinner('Parsing Expo config');
    const { stdout: expoConfigJson } = await $({
      quiet: true,
    })`${this.expoCliPath} config --type public --json`;
    if (!expoConfigJson) {
      throw new Error('Failed to read Expo config');
    }
    debug('Expo config: %s', expoConfigJson);
    try {
      this.expoConfig = JSON.parse(expoConfigJson) as Record<string, unknown>;
    } catch (err) {
      throw new Error(`Failed to parse Expo config. Cause: ${err}`, {
        cause: err,
      });
    }
    stopSpinner();

    spinner('Parsing metadata file');
    const metadataPath = path.resolve(this.exportOutDir, 'metadata.json');
    const metadataJson = readFileSync(metadataPath, 'utf8');
    let metadata: UpdateMetadata;
    try {
      metadata = JSON.parse(metadataJson) as UpdateMetadata;
    } catch (err) {
      throw new Error(`Failed to parse metadata file. Cause: ${err}`, {
        cause: err,
      });
    } finally {
      stopSpinner();
    }

    return metadata;
  }

  resolveRuntimeVersion() {
    if (!this.expoConfig) {
      throw new Error('Expo config is not parsed');
    }

    const runtimeVersion = (get(this.expoConfig, ['expo', 'runtimeVersion']) ??
      get(this.expoConfig, ['expo', 'version']) ??
      '1.0.0') as string;

    return Promise.resolve(runtimeVersion);
  }

  getExtraUpdateParams() {
    return {
      expoAppConfig: this.expoConfig,
    };
  }
}

export class ReactNativeExporter implements Exporter {
  private readonly exportOutDir: string;
  private readonly rnCliPath: string;
  private exportedBundlePaths: Record<Platform, string | undefined> = {
    ios: undefined,
    android: undefined,
  };

  constructor(private readonly projectDir: string) {
    this.exportOutDir = getExportOutDir(projectDir);
    this.rnCliPath = resolveFrom(projectDir, 'react-native/cli.js');
  }

  private getBundlePath(platform: string) {
    const bundleName =
      platform === 'ios' ? 'main.jsbundle' : 'index.android.bundle';
    return path.resolve(this.exportOutDir, bundleName);
  }

  private resolveEntryFile(platform: string) {
    // TODO package.json main file

    const testFileNames = ['index.js', `index.${platform}.js`];
    for (const fileName of testFileNames) {
      const filePath = path.resolve(this.projectDir, fileName);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    return null;
  }

  private getAssetsDestDir(platform: string) {
    return path.resolve(this.exportOutDir, platform);
  }

  private async resolvePlatformOptions() {
    const options = {} as Record<
      Platform,
      {
        entryFilePath: string;
        hermesEnabled: boolean;
      }
    >;

    for (const platform of platforms) {
      let entryFilePath = this.resolveEntryFile(platform);
      if (!entryFilePath) {
        console.log(`Could not find entry file for ${platform}`);
        entryFilePath = await input({
          message: `Enter the path to the entry file for ${platform}`,
          required: true,
        });
      }

      let hermesEnabled = isHermesEnabled(this.projectDir, platform);
      if (hermesEnabled === null) {
        hermesEnabled =
          (await select({
            message: `Which JS engine do you use for ${chalk.cyan(platform)}?`,
            choices: ['Hermes', 'JSC'] as const,
          })) === 'Hermes';
      }

      options[platform] = {
        entryFilePath,
        hermesEnabled,
      };

      debug(
        `Hermes is ${hermesEnabled ? 'enabled' : 'disabled'} for ${platform}`
      );
    }

    return options;
  }

  async export() {
    if (!fs.existsSync(this.exportOutDir)) {
      fs.mkdirSync(this.exportOutDir, { recursive: true });
    }

    const options = await this.resolvePlatformOptions();

    for (const platform of platforms) {
      const { entryFilePath, hermesEnabled } = options[platform];
      const assetsDestDir = this.getAssetsDestDir(platform);
      const jsBundlePath = this.getBundlePath(platform);

      spinner(`Exporting bundle & assets for ${platform}`);
      await $({
        quiet: true,
      })`${this.rnCliPath} bundle --platform ${platform} --entry-file ${entryFilePath} \
        --bundle-output ${jsBundlePath} \
        --assets-dest ${assetsDestDir} \
        --minify ${!hermesEnabled} \
        --dev false`;

      if (hermesEnabled) {
        const hermesBinPath = resolveHermescPath(this.projectDir);
        const hermesBundlePath = `${jsBundlePath}.hbc`;
        await $({
          quiet: true,
        })`${hermesBinPath} -emit-binary ${jsBundlePath} -out ${hermesBundlePath}`;
        try {
          fs.rmSync(jsBundlePath);
          fs.renameSync(hermesBundlePath, jsBundlePath);
        } catch {}
      }

      this.exportedBundlePaths[platform] = jsBundlePath;

      stopSpinner();
    }
  }

  resolveBundleAndAssets() {
    const metadata: UpdateMetadata = {
      version: 0,
      bundler: 'react-native',
      fileMetadata: {},
    };

    for (const platform of platforms) {
      if (!this.exportedBundlePaths[platform]) {
        throw new Error(`Bundle for ${platform} is not exported`);
      }

      metadata.fileMetadata[platform] = {
        bundle: path.relative(
          this.exportOutDir,
          this.exportedBundlePaths[platform]
        ),
        assets: [],
      };

      const matchingFilePaths = glob.sync(
        `${this.getAssetsDestDir(platform)}/**/*`,
        {
          onlyFiles: true,
        }
      );

      for (const filePath of matchingFilePaths) {
        const relativePath = path.relative(this.exportOutDir, filePath);

        if (
          relativePath === metadata.fileMetadata[platform].bundle ||
          relativePath === 'metadata.json'
        ) {
          continue;
        }

        metadata.fileMetadata[platform].assets.push({
          path: relativePath,
          ext: path.extname(filePath),
        });
      }
    }

    spinner('Writing metadata file');
    const metadataPath = path.resolve(this.exportOutDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    stopSpinner();

    return Promise.resolve(metadata);
  }

  async resolveRuntimeVersion() {
    let version = '1.0.0';
    try {
      const packageJson = path.resolve(this.projectDir, 'package.json');
      const packageJsonContent = JSON.parse(
        readFileSync(packageJson, 'utf8')
      ) as Record<string, unknown>;
      const packageVersion = packageJsonContent.version as string | undefined;

      if (packageVersion) {
        version = packageVersion;
      }
    } catch (e) {
      debug('Failed to resolve runtime version from package.json', e);
    }

    return await input({
      message: 'Runtime version',
      default: version,
      required: true,
    });
  }

  getExtraUpdateParams() {
    return {};
  }
}
