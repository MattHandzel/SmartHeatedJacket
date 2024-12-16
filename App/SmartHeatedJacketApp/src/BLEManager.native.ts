import { BleManager, Device, Service, Characteristic } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

class BLEManagerClass {
  private manager: BleManager;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Please grant all permissions to use Bluetooth features.'
          );
        }
      } catch (err) {
        console.warn('Permission error:', err);
      }
    }
  }

  startScan(serviceUUID: string): Promise<Device[]> {
    return new Promise((resolve, reject) => {
      const foundDevices: Device[] = [];
      this.manager.startDeviceScan(
        [serviceUUID],
        null,
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            this.manager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && device.name === 'temperature_server') {
            console.log('Found device:', device.name, device.id);
            foundDevices.push(device);
            this.manager.stopDeviceScan();
            resolve(foundDevices);
          }
        }
      );

      setTimeout(() => {
        this.manager.stopDeviceScan();
        if (foundDevices.length === 0) {
          reject(new Error('No devices found.'));
        }
      }, 10000);
    });
  }

  connect(device: Device): Promise<Device> {
    return this.manager.connectToDevice(device.id)
      .then((connectedDevice) => connectedDevice.discoverAllServicesAndCharacteristics())
      .catch((error) => {
        console.error('Connection error:', error);
        throw error;
      });
  }

  getServices(device: Device): Promise<Service[]> {
    return device.services();
  }

  monitorCharacteristic(
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      device.monitorCharacteristicForService(
        serviceUUID,
        characteristicUUID,
        (error, characteristic) => {
          if (error) {
            console.error('Monitor error:', error);
            reject(error);
            return;
          }

          if (characteristic?.value) {
            const decodedData = Buffer.from(characteristic.value, 'base64').toString('utf-8');
            callback(decodedData);
          }
        }
      );
      resolve();
    });
  }

  writeCharacteristic(
    device: Device,
    serviceUUID: string,
    characteristicUUID: string,
    value: string
  ): Promise<void> {
    const base64Value = Buffer.from(value, 'utf-8').toString('base64');
    return device.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Value
    )
      .then(() => {
        console.log('Write successful:', value);
      })
      .catch((error) => {
        console.error('Write error:', error);
        throw error;
      });
  }

  disconnect(device: Device): Promise<void> {
    return this.manager.cancelDeviceConnection(device.id)
      .then(() => {
        console.log('Disconnected from device:', device.name);
      })
      .catch((error) => {
        console.error('Disconnect error:', error);
        throw error;
      });
  }

  destroy() {
    this.manager.destroy();
  }
}

const BLEManagerInstance = new BLEManagerClass();
export default BLEManagerInstance;
export type BLEDevice = Device;
