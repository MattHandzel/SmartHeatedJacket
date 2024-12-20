
import 'dotenv/config';

export default {
  expo: {
    name: "SmartHeatedJacketApp",
    slug: "SmartHeatedJacketApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.SmartHeatedJacketApp",
      infoPlist: {
        NSBluetoothAlwaysUsageDescription: "This app uses Bluetooth to connect to your Smart Heated Jacket."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.SmartHeatedJacketApp",
      permissions: ["BLUETOOTH", "BLUETOOTH_ADMIN", "ACCESS_FINE_LOCATION"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "4c7dceba-86b0-4258-848a-f89d06e1f136"
      }
    },
    plugins: [

    ]
  }
};
