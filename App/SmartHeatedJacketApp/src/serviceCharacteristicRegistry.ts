
export interface ServiceCharacteristicsRegistry {
  [serviceUUID: string]: {
    name: string;
    characteristics: {
      [charUUID: string]: string;
    };
  };
}

export const SERVICE_CHARACTERISTICS: ServiceCharacteristicsRegistry = {
  'a07498ca-ad5b-474e-940d-16f1fbe7e8cd': {
    name: 'Temperature Service',
    characteristics: {
      '51ff12bb-3ed8-46e5-b4f9-d64e2fec021b': 'Temperature Control',
    },
  },
};
