import fs from 'node:fs';
import path from 'node:path';

export const removeTrailingSlash = (url: string) =>
  url.endsWith('/') ? url.slice(0, -1) : url;

export const assertInsideNpmPackageRootDir = (dir = process.cwd()) => {
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    throw new Error(`Not a valid npm package directory: ${dir}`);
  }
};

export const assertReadableFile = (filePath: string) => {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    throw new Error(`File does not exist or is not readable: ${filePath}`);
  }
};
