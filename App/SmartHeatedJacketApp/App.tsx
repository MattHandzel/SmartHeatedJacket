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
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { BleManager, Device, Service, Characteristic } from 'react-native-ble-plx';
import base64 from 'react-native-base64';
import { DEVICE_NAME } from './config';
import { SERVICE_CHARACTERISTICS, ServiceCharacteristicsRegistry } from './serviceCharacteristicRegistry';
import { TargetTemperatureCharacteristic, CharacteristicsMap } from './types';

const App: React.FC = () => {
  const [manager] = useState<BleManager>(new BleManager());
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [targetTemp, setTargetTemp] = useState<string>('');
  const [faults, setFaults] = useState<string>('');
  
  const [characteristicsMap, setCharacteristicsMap] = useState<CharacteristicsMap>({});

  useEffect(() => {
    const startScan = async () => {
      //Check both android and ios
      if (Platform.OS === 'android') {
        const apiLevel = Platform.Version;
        const permissions: string[] = [];
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          Alert.alert('Permissions required', 'Bluetooth permissions are required');
          return;
        }
      }
      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          console.log(error);
          Alert.alert('Scaningn error', error.message);
          return;
        }

        if (device.name && device.name.includes(DEVICE_NAME)) {
          setDevices((prevDevices) => {
            if (!prevDevices.find((d) => d.id === device.id)) {
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });
    };

    startScan();

    return () => {
      manager.stopDeviceScan();
      manager.destroy();
    };
  }, [manager]);

  const connectToDevice = async (device: Device) => {
    try {
      const connected = await device.connect();
      setConnectedDevice(connected);
      await connected.discoverAllServicesAndCharacteristics();
      const services: Service[] = await connected.services();

      console.log('Discovered Services:', services);
      let charMap: CharacteristicsMap = { ...characteristicsMap };
      for (const service of services) {
        const serviceUUID = service.uuid.toUpperCase();
        const serviceInfo: ServiceCharacteristicsRegistry[keyof ServiceCharacteristicsRegistry] | undefined = SERVICE_CHARACTERISTICS[serviceUUID];
        if (serviceInfo) {
          const characteristics: Characteristic[] = await connected.characteristicsForService(service.uuid);
          console.log(`Service ${service.uuid} (${serviceInfo.name}) has characteristics:`, characteristics);

          characteristics.forEach((char) => {
            const charUUID = char.uuid.toUpperCase();
            const charName = serviceInfo.characteristics[charUUID];
            if (charName) {
              switch (charName) {
                case 'Temperature Data':
                  subscribeToTemperature(connected, service.uuid, char.uuid);
                  break;
                case 'Faults Data':
                  subscribeToFaults(connected, service.uuid, char.uuid);
                  break;
                case 'Target Temperature Control':
                  setTargetTemperatureCharacteristic(service.uuid, char.uuid);
                  break;
                default:
                  console.log('Unhandled characteristic:', charName);
              }
            }
          });
        } else {
          console.log('Unknown service:', service.uuid);
        }
      }
      setCharacteristicsMap(charMap);
    } catch (error: any) {
      console.log('Connection error:', error);
      Alert.alert('Connection error', error.message);
    }
  };

  const setTargetTemperatureCharacteristic = (serviceUUID: string, charUUID: string) => {
    setCharacteristicsMap((prev) => ({
      ...prev,
      targetTemp: { serviceUUID, charUUID },
    }));
  };

  const subscribeToTemperature = (device: Device, serviceUUID: string, charUUID: string) => {
    device.monitorCharacteristicForService(serviceUUID, charUUID, (error, characteristic) => {
      if (error) {
        console.log('Temperature subscription error:', error);
        return;
      }

      if (characteristic?.value) {
        const data = base64.decode(characteristic.value);
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'temperature') {
            setTemperature(parsedData.value);
          }
          if (parsedData.type === 'faults') {
            setFaults(parsedData.value);
          }
        } catch (parseError) {
          console.log('Data parsing error:', parseError);
        }
      }
    });
  };

  const subscribeToFaults = (device: Device, serviceUUID: string, charUUID: string) => {
    device.monitorCharacteristicForService(serviceUUID, charUUID, (error, characteristic) => {
      if (error) {
        console.log('Faults subscription error:', error);
        return;
      }

      if (characteristic?.value) {
        const data = base64.decode(characteristic.value);
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'faults') {
            setFaults(parsedData.value);
          }
        } catch (parseError) {
          console.log('Data parsing error:', parseError);
        }
      }
    });
  };

  const sendTargetTemperature = async () => {
    if (!connectedDevice) {
      Alert.alert('No device connected', 'Please connect to a device first');
      return;
    }

    if (!targetTemp) {
      Alert.alert('Input required', 'Please enter a target temperature');
      return;
    }

    const targetChar = characteristicsMap.targetTemp;
    if (!targetChar) {
      Alert.alert('Characteristic not found', 'Target temperature characteristic not found');
      return;
    }

    try {
      const { serviceUUID, charUUID } = targetChar;
      const command = { type: 'setTargetTemperature', value: parseFloat(targetTemp) };
      const commandData = JSON.stringify(command);
      await connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        charUUID,
        base64.encode(commandData)
      );
      Alert.alert('Success', 'Target temperature set.');
      setTargetTemp('');
    } catch (error: any) {
      console.log('Error writing target temperature:', error);
      Alert.alert('Write error', error.message);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        await connectedDevice.cancelConnection();
        setConnectedDevice(null);
        setTemperature(null);
        setFaults('');
        setCharacteristicsMap({});
      } catch (error: any) {
        console.log('Disconnection error:', error);
        Alert.alert('Disconnection error', error.message);
      }
    }
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {!connectedDevice ? (
        <View style={styles.scanContainer}>
          <Text style={styles.title}>Available Devices:</Text>
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
            Current Temperature: {temperature !== null ? `${temperature}°C` : 'N/A'}
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Set Target Temperature:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={targetTemp}
              onChangeText={setTargetTemp}
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
//non finalized, we can discuss design and how important it is
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scanContainer: {
    flex: 1,
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