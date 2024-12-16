const BLEManager = {
  requestPermissions: async (): Promise<void> => {
    console.log('Web: requestPermissions called, no action needed.');
  },

  startScan: async (serviceUUID: string): Promise<BluetoothDevice[]> => {
    console.log('Web: Starting device scan...');
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUUID] }],
      });
      console.log('Web: Found device:', device.name, device.id);
      return [device];
    } catch (error) {
      console.error('Web: Scan error:', error);
      throw error;
    }
  },

  connect: async (device: BluetoothDevice): Promise<BluetoothRemoteGATTServer> => {
    console.log('Web: Connecting to device...');
    try {
      const server = device.gatt;
      if (!server) {
        throw new Error('Web: Device does not have a GATT server');
      }
      const connectedServer = await server.connect();
      console.log('Web: Connected to device.');
      return connectedServer;
    } catch (error) {
      console.error('Web: Connection error:', error);
      throw error;
    }
  },

  getServices: async (server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTService[]> => {
    console.log('Web: Getting services...');
    try {
      const services = await server.getPrimaryServices();
      console.log('Web: Retrieved services:', services);
      return services;
    } catch (error) {
      console.error('Web: Get services error:', error);
      throw error;
    }
  },

  monitorCharacteristic: async (
    server: BluetoothRemoteGATTServer,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: string) => void
  ): Promise<void> => {
    console.log('Web: Monitoring characteristic...');
    try {
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value;
        const data = new TextDecoder().decode(value);
        callback(data);
      });
      console.log('Web: Notifications started.');
    } catch (error) {
      console.error('Web: Monitor characteristic error:', error);
      throw error;
    }
  },

  writeCharacteristic: async (
    server: BluetoothRemoteGATTServer,
    serviceUUID: string,
    characteristicUUID: string,
    value: string
  ): Promise<void> => {
    console.log('Web: Writing to characteristic...');
    try {
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      const encoder = new TextEncoder();
      await characteristic.writeValue(encoder.encode(value));
      console.log('Web: Write successful:', value);
    } catch (error) {
      console.error('Web: Write error:', error);
      throw error;
    }
  },

  disconnect: async (server: BluetoothRemoteGATTServer): Promise<void> => {
    console.log('Web: Disconnecting from device...');
    try {
      server.disconnect();
      console.log('Web: Disconnected.');
    } catch (error) {
      console.error('Web: Disconnect error:', error);
      throw error;
    }
  },
};

export default BLEManager;
