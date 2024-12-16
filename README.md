# SmartHeatedJacket

Smart heated jacket that can be controlled from a mobile app. Final project for CS 437: Wireless Internet of Things. The heated fabric is heated using a PID controller with a thermometer as ground truth. There is also a pressure sensor (force-sensitive resistor) that tracks if the jacket is being worn. The jacket is heated through a Bluetooth server hosted on a microcontroller that is inside the jacket. There is an app that runs a BLE client that communicates with the jacket's server.

### Directory Structure

```
├──  App -- Code for mobile app
├──  Firmware -- Code for firmware to be run on an ESP32
├──  Hardware -- Pictures of the hardware, circuit diagram
```

## Instructions for Running (Potentially) Mobile App

To use the mobile app:
1. `cd` to the `App/SmartHeatedJacket` directory.
2. Run `npm start` to start the app.
3. Hit `w` (or whatever key corresponds to the app device you want to use).
4. Ensure that Bluetooth is enabled on your server.
5. You're good to go!

## Instructions for Running BLE Server
1. Activate the Python virtual environment with the terminal command:  
   `source venv/bin/activate`
2. Run the BLE server with:  
   `python3 Firmware/ble_server.py`
