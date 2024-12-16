
import { Platform } from 'react-native';
import { BleManager as MobileBleManager, Device as MobileDevice } from 'react-native-ble-plx';

export interface BLEDevice {
  id: string;
  name: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  discoverServicesAndCharacteristics: () => Promise<void>;
  getServices: () => Promise<BleService[]>;
  monitorCharacteristic: (
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: string) => void
  ) => Promise<void>;
  writeCharacteristic: (serviceUUID: string, characteristicUUID: string, data: string) => Promise<void>;
}

export interface BleService {
  uuid: string;
  characteristics: BleCharacteristic[];
}

export interface BleCharacteristic {
  uuid: string;
}

export interface BLEManagerInterface {
  startScan: (deviceName: string) => Promise<BLEDevice[]>;
  stopScan: () => void;
}

export const BLEManager: BLEManagerInterface = Platform.select({
  ios: () => require('./BLEManagerMobile').default,
  android: () => require('./BLEManagerMobile').default,
  web: () => require('./BLEManagerWeb').default,
})();
