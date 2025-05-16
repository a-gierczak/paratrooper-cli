import pkgDir from 'pkg-dir';
import path from 'path';
import { createReadStream } from 'node:fs';
import { debug as makeLogger } from 'debug';
import fetch from 'node-fetch';
import { stat } from 'fs/promises';
import md5File from 'md5-file';
import mime from 'mime';
import type { CommandModule } from 'yargs';
import { input } from '@inquirer/prompts';
import { SingleBar } from 'cli-progress';
import {
  prepareUpdate,
  commitUpdate,
  healthCheck,
} from '../api/default/default';
import { StorageObject } from '../api/model';
import { withSpinner, stopSpinner, spinner } from '../lib/ui';
import { getExportOutDir, resolveExporter } from '../lib/export';
import { getConfig } from '../lib/config';

const debug = makeLogger(`ota:update`);

export interface Asset {
  path: string;
  ext: string;
}

interface Args {
  message?: string;
  version?: string;
  skipExport: boolean;
}

export const updateCommand: CommandModule<unknown, Args> = {
  command: 'update',
  describe: 'Create a new update',
  builder: (yargs) =>
    yargs.options({
      message: {
        type: 'string',
        description: 'A message to describe the update',
        alias: 'm',
      },
      version: {
        type: 'string',
        description: 'The version of the update',
        alias: 'v',
      },
      skipExport: {
        type: 'boolean',
        description: 'Skip extracting bundle. Useful for debugging.',
        default: false,
      },
    }),
  async handler(args) {
    const { projectID } = getConfig();
    const projectDir = await pkgDir();
    if (!projectDir) {
      throw new Error('You need to run this command inside a NPM project');
    }

    try {
      await healthCheck({ signal: AbortSignal.timeout(2000) });
    } catch (error) {
      throw new Error('Failed to connect to the server.', {
        cause: error,
      });
    }

    let message = args.message;
    if (!message) {
      message = await input({ message: 'Enter a message', required: true });
    }

    const exporter = resolveExporter(projectDir);
    debug(`Using exporter: ${exporter.constructor.name}`);

    const exportOutDir = getExportOutDir(projectDir);

    if (!args.skipExport) {
      await exporter.export();
    }

    const bundleAndAssets = await exporter.resolveBundleAndAssets();
    const runtimeVersion =
      args.version ?? (await exporter.resolveRuntimeVersion());
    const metadataPath = path.resolve(exportOutDir, 'metadata.json');

    const fileMetadata: StorageObject[] = [];

    fileMetadata.push({
      path: 'metadata.json',
      extension: 'json',
      contentLength: (await stat(metadataPath)).size,
      md5Hash: await md5File(metadataPath),
      contentType: 'application/json',
    });

    for (const [_platform, meta] of Object.entries(
      bundleAndAssets.fileMetadata
    )) {
      const { bundle, assets } = meta;
      const bundleAbsPath = path.join(exportOutDir, bundle);
      fileMetadata.push({
        path: bundle,
        extension: path.extname(bundle).slice(1),
        contentLength: (await stat(bundleAbsPath)).size,
        md5Hash: await md5File(bundleAbsPath),
        contentType: 'application/javascript',
      });

      for (const asset of assets) {
        const assetAbsPath = path.join(exportOutDir, asset.path);
        fileMetadata.push({
          path: asset.path,
          extension: asset.ext,
          contentLength: (await stat(assetAbsPath)).size,
          md5Hash: await md5File(assetAbsPath),
          contentType: mime.getType(asset.ext) ?? '',
        });
      }
    }

    debug('fileMetadata', fileMetadata);

    spinner('Preparing update');
    const {
      data: { updateID, uploadURLs },
    } = await prepareUpdate(projectID, {
      runtimeVersion,
      fileMetadata,
      message,
      ...exporter.getExtraUpdateParams(),
    });
    stopSpinner();

    debug('updateId', updateID);
    debug('uploadURLs', uploadURLs);

    const bar = new SingleBar({
      format: 'Uploading assets | {bar} | {value}/{total} Files',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });
    bar.start(uploadURLs.length, 0);

    const promises = uploadURLs.map(async ({ path: assetPath, url }) => {
      const fullPath = path.join(exportOutDir, assetPath);
      const metaData = fileMetadata.find((f) => f.path === assetPath);
      if (!metaData) {
        throw new Error(`Failed to find metadata for ${assetPath}`);
      }

      const res = await fetch(url, {
        method: 'PUT',
        body: createReadStream(fullPath),
        headers: {
          'Content-Length': (await stat(fullPath)).size.toString(),
          'Content-Type': metaData.contentType,
        },
      });
      if (!res.ok) {
        bar.stop();
        const data = await res.text();
        throw new Error(`Failed to upload file: ${data}`);
      }
      bar.increment();
    });

    await Promise.all(promises);
    bar.stop();

    await withSpinner(commitUpdate(projectID, updateID), 'Committing update');

    console.log('\nUpdate created! 🎉');
    console.log(`ID: ${updateID}`);
    console.log(
      "\nWe're now processing your update. It should be live in a couple of minutes."
    );
  },
};
