
import { Platform } from 'react-native';
import BLEManagerNative from './BLEManager.native';
import BLEManagerWeb from './BLEManager.web';

const BLEManager = Platform.OS === 'web' ? BLEManagerWeb : BLEManagerNative;

export default BLEManager;
export type BLEDevice = any;