import resolveFrom from 'resolve-from';
import {
  type UpdateProtocol,
  UpdateProtocol as UpdateProtocolEnum,
} from '../api/model';

export const getProtocolName = (protocol: UpdateProtocol) => {
  return protocol === 'expo' ? 'Expo Updates' : 'CodePush';
};

export const isValidProtocol = (
  protocol: string
): protocol is UpdateProtocol => {
  return protocol in UpdateProtocolEnum;
};

export const assertPackageInstalledForProtocol = (
  projectDir: string,
  protocol: UpdateProtocol
) => {
  if (protocol === 'expo') {
    resolveFrom(projectDir, 'expo-updates');
  } else {
    resolveFrom(projectDir, 'react-native-code-push');
  }
};
