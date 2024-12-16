export interface TargetTemperatureCharacteristic {
    serviceUUID: string;
    charUUID: string;
  }
  
  export interface CharacteristicsMap {
    [key: string]: any;
    targetTemp?: TargetTemperatureCharacteristic;
  }
  
  export interface TemperaturePressureData {
    temperature: number;
    pressure: number;
  }
  