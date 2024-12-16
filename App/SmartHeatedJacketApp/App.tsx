
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import BLEManager, { BLEDevice } from './src/BLEManager';
import { DEVICE_NAME, SERVICE_UUID, TEMPERATURE_CHAR_UUID } from './src/config';

const App: React.FC = () => {
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [connectedServer, setConnectedServer] = useState<BluetoothRemoteGATTServer | null>(null); 
  const [temperature, setTemperature] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [targetTemp, setTargetTemp] = useState<string>('');
  const [faults, setFaults] = useState<string>('');

  const [targetTempServiceUUID, setTargetTempServiceUUID] = useState<string>('');
  const [targetTempCharUUID, setTargetTempCharUUID] = useState<string>('');

  useEffect(() => {
    console.log('App mounted');
    if (Platform.OS !== 'web') {
      BLEManager.requestPermissions()
        .then(() => console.log('Permissions granted'))
        .catch((error) => console.error('Permission request error:', error));
    }

    return () => {
      if (connectedDevice && Platform.OS !== 'web') {
        console.log(`Disconnecting from device on unmount: ${connectedDevice.name}`);
        BLEManager.disconnect(connectedDevice)
          .then(() => console.log('Disconnected successfully'))
          .catch((error) => console.error('Error during disconnect on unmount:', error));
      }
      if (connectedServer && Platform.OS === 'web') {
        console.log(`Disconnecting from server on unmount`);
        BLEManager.disconnect(connectedServer)
          .then(() => console.log('Disconnected successfully'))
          .catch((error) => console.error('Error during disconnect on unmount:', error));
      }
    };
  }, [connectedDevice, connectedServer]);

  const scanForDevices = async () => {
    console.log('Starting device scan...');
    try {
      const foundDevices = await BLEManager.startScan(SERVICE_UUID);
      console.log('Scan completed. Found devices:', foundDevices);
      setDevices(foundDevices);
    } catch (error: any) {
      console.error('Error during device scan:', error);
      Alert.alert('Error', `Device scan failed: ${error.message}`);
    }
  };

  const connectToDevice = async (device: BLEDevice) => {
    console.log(`Attempting to connect to device: ${device.name} (${device.id})`);
    try {
      if (Platform.OS !== 'web') {
        await BLEManager.connect(device);
        setConnectedDevice(device);
        Alert.alert('Connected', `Connected to ${device.name}`);

        setTargetTempServiceUUID(SERVICE_UUID);
        setTargetTempCharUUID(TEMPERATURE_CHAR_UUID);

        await BLEManager.monitorCharacteristic(
          device,
          SERVICE_UUID,
          TEMPERATURE_CHAR_UUID,
          (data: string) => {
            console.log(`Data received from Temperature Control characteristic: ${data}`);
            const [tempStr, pressureStr] = data.split(',').map((s) => s.trim());
            const temp = parseFloat(tempStr);
            const pressureVal = parseFloat(pressureStr);
            if (!isNaN(temp) && !isNaN(pressureVal)) {
              setTemperature(temp);
              setPressure(pressureVal);
              console.log(`Parsed temperature: ${temp}°F, pressure: ${pressureVal} hPa`);
            } else {
              console.warn('Received invalid data format:', data);
            }
          }
        );
        console.log('Monitoring set up successfully.');
      } else {
        const server = await BLEManager.connect(device);
        setConnectedServer(server);
        setConnectedDevice(device);
        Alert.alert('Connected', `Connected to ${device.name}`);

        setTargetTempServiceUUID(SERVICE_UUID);
        setTargetTempCharUUID(TEMPERATURE_CHAR_UUID);

        await BLEManager.monitorCharacteristic(
          server,
          SERVICE_UUID,
          TEMPERATURE_CHAR_UUID,
          (data: string) => {
            console.log(`Data received from Temperature Control characteristic: ${data}`);
            const [tempStr, pressureStr] = data.split(',').map((s) => s.trim());
            const temp = parseFloat(tempStr);
            const pressureVal = parseFloat(pressureStr);
            if (!isNaN(temp) && !isNaN(pressureVal)) {
              setTemperature(temp);
              setPressure(pressureVal);
              console.log(`Parsed temperature: ${temp}°F, pressure: ${pressureVal} hPa`);
            } else {
              console.warn('Received invalid data format:', data);
            }
          }
        );
        console.log('Monitoring set up successfully.');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert('Connection Error', error.message);
    }
  };

  /**
   * Send the target temperature to the BLE device.
   */
  const sendTargetTemperature = async () => {
    console.log('Attempting to send target temperature...');
    if (!connectedDevice) {
      console.warn('No device connected. Cannot send temperature.');
      Alert.alert('No Device', 'Please connect to a device first.');
      return;
    }

    if (!targetTemp) {
      console.warn('Target temperature input is empty.');
      Alert.alert('Input Required', 'Please enter a target temperature.');
      return;
    }

    if (!targetTempServiceUUID || !targetTempCharUUID) {
      console.warn('Target Temperature Service or Characteristic UUID not set.');
      Alert.alert('Characteristic Not Found', 'Temperature Control characteristic not found.');
      return;
    }

    try {
      const temperatureValue = parseInt(targetTemp, 10);
      console.log(`Parsed target temperature: ${temperatureValue}`);

      if (isNaN(temperatureValue) || temperatureValue < -100 || temperatureValue > 100) {
        console.warn('Invalid temperature value entered:', targetTemp);
        Alert.alert('Invalid Input', 'Please enter a valid temperature between -100 and 100°F.');
        return;
      }

      console.log(
        `Writing to characteristic: Service UUID = ${targetTempServiceUUID}, Characteristic UUID = ${targetTempCharUUID}, Value = ${temperatureValue}`
      );

      if (Platform.OS !== 'web') {
        await BLEManager.writeCharacteristic(
          connectedDevice,
          targetTempServiceUUID,
          targetTempCharUUID,
          temperatureValue.toString()
        );
      } else {
        if (!connectedServer) {
          throw new Error('No connected server on web platform.');
        }
        await BLEManager.writeCharacteristic(
          connectedServer,
          targetTempServiceUUID,
          targetTempCharUUID,
          temperatureValue.toString()
        );
      }

      console.log('Write operation successful.');
      Alert.alert('Success', 'Target temperature set.');
      setTargetTemp('');
    } catch (error: any) {
      console.error('Write error:', error);
      Alert.alert('Write Error', error.message);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      console.log(`Attempting to disconnect from device: ${connectedDevice.name}`);
      try {
        if (Platform.OS !== 'web') {
          await BLEManager.disconnect(connectedDevice);
        } else {
          if (!connectedServer) {
            throw new Error('No connected server on web platform.');
          }
          await BLEManager.disconnect(connectedServer);
        }
        console.log(`Disconnected from device: ${connectedDevice.name}`);
        setConnectedDevice(null);
        setConnectedServer(null);
        setTemperature(null);
        setPressure(null);
        setFaults('');
        setTargetTempServiceUUID('');
        setTargetTempCharUUID('');
        Alert.alert('Disconnected', `Disconnected from ${connectedDevice.name}`);
      } catch (error: any) {
        console.error('Disconnect error:', error);
        Alert.alert('Disconnect Error', error.message);
      }
    } else {
      console.warn('No device is currently connected.');
    }
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => (
    <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {!connectedDevice ? (
        <View style={styles.scanContainer}>
          <Text style={styles.title}>Available Devices:</Text>
          <Button title="Scan for Devices" onPress={scanForDevices} />
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDevice}
            ListEmptyComponent={<Text style={styles.noDevices}>No devices found.</Text>}
          />
        </View>
      ) : (
        <View style={styles.deviceContainer}>
          <Text style={styles.title}>Connected to {connectedDevice.name}</Text>
          <Text style={styles.info}>
            Current Temperature: {temperature !== null ? `${temperature}°F` : 'N/A'}
          </Text>
          <Text style={styles.info}>
            Current Pressure: {pressure !== null ? `${pressure} hPa` : 'N/A'}
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Set Target Temperature:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetTemp}
              onChangeText={(text) => {
                console.log(`Target temperature input changed: ${text}`);
                setTargetTemp(text);
              }}
              placeholder="e.g., 25"
            />
            <Button title="Set" onPress={sendTargetTemperature} />
          </View>
          <View style={styles.faultContainer}>
            <Text style={styles.faultTitle}>Faults Detected:</Text>
            <Text style={styles.faultText}>{faults || 'No faults detected'}</Text>
          </View>
          <Button title="Disconnect" color="#FF5C5C" onPress={disconnectDevice} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scanContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: '100%',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
  },
  title: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  info: {
    fontSize: 18,
    marginVertical: 8,
  },
  inputContainer: {
    marginVertical: 12,
    alignItems: 'center',
    width: '80%',
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    width: '100%',
    textAlign: 'center',
    marginBottom: 8,
    borderRadius: 4,
  },
  faultContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    width: '90%',
  },
  faultTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#856404',
  },
  faultText: {
    color: '#856404',
  },
  noDevices: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

export default App;
