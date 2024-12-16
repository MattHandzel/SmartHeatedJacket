export interface BleCharacteristic {
  uuid: string;
  name?: string;
}

export interface BleService {
  uuid: string;
  name?: string;
  characteristics: BleCharacteristic[];
}

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
  writeCharacteristic: (
    serviceUUID: string,
    characteristicUUID: string,
    value: string
  ) => Promise<void>;
}

export interface BLEManagerInterface {
  startScan: (deviceName: string) => Promise<BLEDevice[]>;
  connect: (device: BLEDevice) => Promise<void>;
  disconnect: (device: BLEDevice) => Promise<void>;
  discoverServicesAndCharacteristics: (device: BLEDevice) => Promise<void>;
  getServices: (device: BLEDevice) => Promise<BleService[]>;
  monitorCharacteristic: (
    device: BLEDevice,
    serviceUUID: string,
    charUUID: string,
    callback: (data: string) => void
  ) => Promise<void>;
  writeCharacteristic: (
    device: BLEDevice,
    serviceUUID: string,
    charUUID: string,
    value: string
  ) => Promise<void>;
}
