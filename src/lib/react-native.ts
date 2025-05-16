import path from 'path';
import fs from 'fs';
import os from 'os';
import resolveFrom from 'resolve-from';

function semverCompare(a: string, b: string): number {
  const aParts = a
    .replace(/[^\d.]/g, '')
    .split('.')
    .map(Number);
  const bParts = b
    .replace(/[^\d.]/g, '')
    .split('.')
    .map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] ?? 0;
    const bVal = bParts[i] ?? 0;
    if (aVal !== bVal) {
      return aVal - bVal;
    }
  }
  return 0;
}

function isHermesEnabledIos(projectRoot: string): boolean | null {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
    dependencies: Record<string, string>;
  };

  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (!fs.existsSync(podfilePath)) {
    return null;
  }

  const content = fs.readFileSync(podfilePath, 'utf8');

  const reactNativeVersion = packageJson.dependencies['react-native'];
  if (!reactNativeVersion) {
    return null;
  }

  // in RN 0.70.0, hermes is enabled by default
  if (semverCompare(reactNativeVersion, '0.70.0') >= 0) {
    const isHermesDisabled =
      content.search(/^\s*:hermes_enabled\s*=>\s*false,?\s+/m) >= 0;
    if (isHermesDisabled) {
      return false;
    }

    return true;
  }

  // For versions < 0.70.0, check ios/Podfile for ":hermes_enabled => true"
  const isHermesBare =
    content.search(/^\s*:hermes_enabled\s*=>\s*true,?\s+/m) >= 0;
  if (isHermesBare) {
    return true;
  }

  return null;
}

function isHermesEnabledAndroid(projectRoot: string): boolean | null {
  const gradlePropertiesPath = path.join(
    projectRoot,
    'android',
    'gradle.properties'
  );
  if (fs.existsSync(gradlePropertiesPath)) {
    const props = parseGradleProperties(
      fs.readFileSync(gradlePropertiesPath, 'utf8')
    );
    const isHermesBare = props.hermesEnabled === 'true';
    if (isHermesBare) {
      return true;
    }
  }

  return null;
}

export function isHermesEnabled(
  projectRoot: string,
  platform: 'ios' | 'android'
): boolean | null {
  if (platform === 'ios') {
    return isHermesEnabledIos(projectRoot);
  }
  return isHermesEnabledAndroid(projectRoot);
}

function parseGradleProperties(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (let line of content.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const sepIndex = line.indexOf('=');
    const key = line.substr(0, sepIndex);
    const value = line.substr(sepIndex + 1);
    result[key] = value;
  }
  return result;
}

export function resolveHermescPath(projectRoot: string): string {
  const platformExecutable = getHermesCommandPlatform();
  const hermescLocations = [
    // Override hermesc dir by environment variables
    process.env.REACT_NATIVE_OVERRIDE_HERMES_DIR
      ? `${process.env.REACT_NATIVE_OVERRIDE_HERMES_DIR}/build/bin/hermesc`
      : '',

    // Building hermes from source
    'react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc',

    // Prebuilt hermesc in official react-native 0.69+
    `react-native/sdks/hermesc/${platformExecutable}`,

    // Legacy hermes-engine package
    `hermes-engine/${platformExecutable}`,
  ];

  for (const location of hermescLocations) {
    try {
      return resolveFrom(projectRoot, location);
    } catch {}
  }
  throw new Error('Cannot find the hermesc executable.');
}

function getHermesCommandPlatform(): string {
  switch (os.platform()) {
    case 'darwin':
      return 'osx-bin/hermesc';
    case 'linux':
      return 'linux64-bin/hermesc';
    case 'win32':
      return 'win64-bin/hermesc.exe';
    default:
      throw new Error(
        `Unsupported host platform for Hermes compiler: ${os.platform()}`
      );
  }
}
