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

  const sendTargetTemperature = async () => {
    console.log('Attempting to send target temperature...');
    if (!connectedDevice) {
      console.warn('No device connected. Cannot send temperature.');
      Alert.alert('No Device', 'Please
