import { BLEDevice, BLEManagerInterface, BleService, BleCharacteristic } from '../BLEManager';
import { BleManager as MobileBleManager, Device as MobileDevice } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { SERVICE_CHARACTERISTICS } from './serviceCharacteristicRegistry';
import { Buffer } from 'buffer';

class MobileBLEManager implements BLEManagerInterface {
  private manager: MobileBleManager;

  constructor() {
    this.manager = new MobileBleManager();
  }

  async startScan(deviceName: string): Promise<BLEDevice[]> {
    const devices: BLEDevice[] = [];

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        Alert.alert('Permissions required', 'Bluetooth permissions are required');
        throw new Error('Bluetooth permissions not granted');
      }
    }

    return new Promise((resolve, reject) => {
      this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          console.log('Scanning error:', error);
          reject(error);
          return;
        }

        if (device?.name && device.name.toUpperCase().includes(deviceName.toUpperCase())) {
          if (!devices.find((d) => d.id === device.id)) {
            console.log(`Found device: ${device.name} (${device.id})`);
            const bleDevice: BLEDevice = {
              id: device.id,
              name: device.name,
              connect: async () => {
                await device.connect();
                await device.discoverAllServicesAndCharacteristics();
              },
              disconnect: () => {
                device.cancelConnection();
              },
              discoverServicesAndCharacteristics: async () => {
                await device.discoverAllServicesAndCharacteristics();
              },
              getServices: async () => {
                const services = await device.services();
                const bleServices: BleService[] = services.map((s) => ({
                  uuid: s.uuid,
                  characteristics: [],
                }));
                return bleServices;
              },
              monitorCharacteristic: async (
                serviceUUID: string,
                characteristicUUID: string,
                callback: (data: string) => void
              ) => {
                device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
                  if (error) {
                    console.log('Monitor error:', error);
                    return;
                  }
                  if (characteristic?.value) {
                    const buffer = Buffer.from(characteristic.value, 'base64');
                    const data = buffer.toString('utf-8');
                    callback(data);
                  }
                });
              },
              writeCharacteristic: async (
                serviceUUID: string,
                characteristicUUID: string,
                data: string
              ) => {
                await device.writeCharacteristicWithResponseForService(
                  serviceUUID,
                  characteristicUUID,
                  Buffer.from(data, 'utf-8').toString('base64')
                );
              },
            };
            devices.push(bleDevice);
            resolve(devices);
          }
        }
      });

      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve(devices);
      }, 10000);
    });
  }

  stopScan() {
    this.manager.stopDeviceScan();
  }
}

export default new MobileBLEManager();
