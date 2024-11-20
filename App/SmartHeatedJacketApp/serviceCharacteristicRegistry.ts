export interface ServiceCharacteristic {
  name: string;
  characteristics: {
    [charUUID: string]: string;
  };
}

export interface ServiceCharacteristicsRegistry {
  [serviceUUID: string]: ServiceCharacteristic;
}

export const SERVICE_CHARACTERISTICS: ServiceCharacteristicsRegistry = {
  'A07498CA-AD5B-474E-940D-16F1FBE7E8CD': {
    name: 'Temperature Service',
    characteristics: {
      '51FF12BB-3ED8-46E5-B4F9-D64E2FEC021B': 'Temperature and Pressure Data',
    },
  },
};