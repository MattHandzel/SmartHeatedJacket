import { BLEDevice, BLEManagerInterface, BleService, BleCharacteristic } from '../BLEManager';

class WebBLEManager implements BLEManagerInterface {
  private devices: BLEDevice[] = [];

  async startScan(deviceName: string): Promise<BLEDevice[]> {
    try {
      console.log('Requesting Bluetooth Device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: deviceName }],
        optionalServices: Object.keys(SERVICE_CHARACTERISTICS),
      });

      const bleDevice: BLEDevice = {
        id: device.id,
        name: device.name || 'Unnamed Device',
        connect: async () => {
          await device.gatt?.connect();
        },
        disconnect: () => {
          device.gatt?.disconnect();
        },
        discoverServicesAndCharacteristics: async () => {},
        getServices: async () => {
          if (!device.gatt) throw new Error('Device not connected');
          const services = await device.gatt.getPrimaryServices();
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
          if (!device.gatt) throw new Error('Device not connected');
          const service = await device.gatt.getPrimaryService(serviceUUID);
          const characteristic = await service.getCharacteristic(characteristicUUID);
          await characteristic.startNotifications();

          characteristic.addEventListener('characteristicvaluechanged', (event) => {
            const value = event.target?.value;
            if (value) {
              const decoder = new TextDecoder('utf-8');
              const dataStr = decoder.decode(value);
              callback(dataStr);
            }
          });
        },
        writeCharacteristic: async (
          serviceUUID: string,
          characteristicUUID: string,
          data: string
        ) => {
          if (!device.gatt) throw new Error('Device not connected');
          const service = await device.gatt.getPrimaryService(serviceUUID);
          const characteristic = await service.getCharacteristic(characteristicUUID);
          const encoder = new TextEncoder();
          const dataBuffer = encoder.encode(data);
          await characteristic.writeValue(dataBuffer);
        },
      };

      if (!this.devices.find((d) => d.id === device.id)) {
        console.log(`Found device: ${device.name} (${device.id})`);
        this.devices.push(bleDevice);
      }

      return this.devices;
    } catch (error: any) {
      console.error('Error during device scan:', error);
      alert(`Error during device scan: ${error.message}`);
      return this.devices;
    }
  }

  stopScan() {}
}

export default new WebBLEManager();
