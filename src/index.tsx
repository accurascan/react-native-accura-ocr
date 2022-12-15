import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-accura-ocr' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const AccuraOcr = NativeModules.AccuraOcr
  ? NativeModules.AccuraOcr
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export default AccuraOcr;
