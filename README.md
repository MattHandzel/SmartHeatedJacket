# SmartHeatedJacket

Smart heated jacket that can be controlled from a mobile app. Final project for CS 437: Wireless Internet of Things. The heated fabric is heated using a PID controller with a thermometer as ground truth. There is also a pressure sensor (force-sesitive resistor) that tracks if the jacket is being worn. The jacket is heated through a Bluetooth server hosted on a microcontroller that is inside the jacket. There is an app that runs a BLE client that communicates with the jacket's server.

### Directory Structure

```
├──  App -- Code for mobile app
├──  Firmware -- Code for firmware to be run on an ESP32
├──  Hardware -- Pictures of the hardware, circuit diagram
```

## Instructions for Running Mobile App

## Instructions for Running BLE Server
1. Activate the python virtual environment with the terminal command `source venv/bin/acivate`
2. Run `python3  Firmware/ble_server.py`