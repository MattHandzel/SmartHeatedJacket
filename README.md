# SmartHeatedJacket

TODO:

### BLE Client on Embedded System for App Communication

rasppi: https://stackoverflow.com/questions/56461087/programming-a-ble-server-and-a-client-both-in-a-raspberry-pi
esp32: https://randomnerdtutorials.com/esp32-ble-server-client/

- [ ] Report temperature to the app
- [ ] Be able to accept commands from the app to change the target temperature

# Temperature Control System

- [ ] Filter temperature readings using kalman filter or smth llike that lmao
- [ ] Just do a PIDF controller for temperature control lmao
- [ ] Research what the "F" needs to be (some goofy ass math idk)

Stretch goals:

- [ ] Learn user preferences based on time of day + weather?
- [ ] Heat separate parts of the jacket, arm, back, front (needs thermometer for each)
- [ ] I wonder if it's possible to measure temperature of the fabric by the current of the wires out of the fabric (the hotter the fabric the higher resistence lower current).

# Fault detection

- [ ] If the temperature reading drops from like 50 to 0 this might mean the thermometer was unplugged, turn off the system
- [ ] If the pin values goes from a reasonable value to "floating" values then something was probably unplugged

# Mobile App

- [ ] Request the current temperature of the jacket or if the jacket is on or off, display it on the app
- [ ] Change the target temperature
- [ ] Detect & display faults

Stretch Goals:

- [ ] Update the firmware from the app would be cool?

# Turn Jacket Off Automatically

- [ ] Use signal processing to prevent false alarms
- [ ] Fuse thermometer readings
- [ ] Turn the embedded system into low power mode, only detect every 10 or 30 seconds for if the user puts the jacket on

# Sewing & Integrating the Electronics into the Jacket/Hoodie

- [ ] We need to buy fabric or use like an old shirt to sew the electronics in (if we want)

# Demo

- [ ] Should we get a thermal camera for the demo to show that it is working?

