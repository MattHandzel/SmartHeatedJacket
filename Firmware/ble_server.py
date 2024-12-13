# ble_server.py

import sys
import logging
import asyncio
import time

from typing import Any, Union

from bless import (
    BlessServer,
    GATTCharacteristicProperties,
    GATTAttributePermissions,
)

from heated_fabric_driver import HeatedFabricDriver
from pressure_driver import get_pressure
from temperature_driver import get_celcius, get_fahrenheit

import board  # Ensure you have access to board definitions

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(name=__name__)

HEAT_PIN = board.D13  # Define HEAT_PIN appropriately

# Initialize the HeatedFabricDriver with corrected PID constants
heated_fabric_driver = HeatedFabricDriver(pin=HEAT_PIN, kP=30, kI=0.8, kD=30, kF=0)


def set_temperature(_, value: Any, **kwargs):
    try:
        temperature = int(value.decode("utf-8"))
        logger.info(f"Set temperature to {temperature}°F")
        heated_fabric_driver.update_temperature(temperature)
    except Exception as e:
        logger.error(f"Error in set_temperature: {e}")


def get_temperature_and_pressure(_, **kwargs) -> bytearray:
    try:
        celsius = get_celsius()
        pressure = get_pressure()
        return f"{celsius}, {pressure}".encode("utf-8")
    except Exception as e:
        logger.error(f"Error in get_temperature_and_pressure: {e}")
        return b"0,0"


async def run(loop):
    trigger = asyncio.Event()
    trigger.clear()

    # Instantiate the server
    server = BlessServer(name="temperature_server", loop=loop)
    server.read_request_func = get_temperature_and_pressure
    server.write_request_func = set_temperature

    # Add Service
    my_service_uuid = "A07498CA-AD5B-474E-940D-16F1FBE7E8CD"
    await server.add_new_service(my_service_uuid)
    logger.debug(f"Added service: {my_service_uuid}")

    # Add a Characteristic to the service
    my_char_uuid = "51FF12BB-3ED8-46E5-B4F9-D64E2FEC021B"
    char_flags = (
        GATTCharacteristicProperties.write
        | GATTCharacteristicProperties.read
        | GATTCharacteristicProperties.indicate
    )
    permissions = GATTAttributePermissions.writeable | GATTAttributePermissions.readable
    await server.add_new_characteristic(
        my_service_uuid, my_char_uuid, char_flags, None, permissions
    )
    logger.debug(
        f"Added characteristic: {my_char_uuid} with properties: {char_flags} and permissions: {permissions}"
    )

    await server.start()
    logger.debug("Advertising")
    logger.info(f"Write '0xF' to the advertised characteristic: {my_char_uuid}")

    # Start the control loop
    asyncio.create_task(control_loop(heated_fabric_driver, trigger))

    # Wait indefinitely
    await trigger.wait()


async def control_loop(driver: HeatedFabricDriver, trigger: asyncio.Event):
    """
    Asynchronous control loop to periodically update the HeatedFabricDriver.
    """
    try:
        while not trigger.is_set():
            await asyncio.sleep(0.1)
            if is_wearing_jacket():
                #print("homie, you are wearing the jacket")
                driver.is_running = True
                driver.update()
            else:
                #print("homie, you aren't wearing the jacket")
                driver.stop()

    except asyncio.CancelledError:
        driver.stop()
        logger.info("Control loop cancelled and driver stopped.")
    except Exception as e:
        logger.error(f"Error in control_loop: {e}")
        driver.stop()
    finally:
        trigger.set()


from constants import MIN_PRESSURE_FOR_WEARING_JACKET

from threading import Condition
import time

import board
import busio
import adafruit_ads1x15.ads1015 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from adafruit_ads1x15.ads1x15 import Mode


i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1015(i2c)
ads.mode = Mode.CONTINUOUS

# Single-ended mode, FSR is being read into analog pin 1
chan = AnalogIn(ads, ADS.P1)

cv = Condition()


def map_range(x, in_min, in_max, out_min, out_max):
    return (x - in_min) * (out_max - out_min) // (in_max - in_min) + out_min


def get_pressure():
    pressure = map_range(chan.value, 0, 1023, 0, 255)
    return pressure


def is_wearing_jacket():
    return get_pressure() > MIN_PRESSURE_FOR_WEARING_JACKET


def low_power_mode():
    with cv:
        while not is_wearing_jacket():
            cv.wait()


if __name__ == "__main__":

    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(run(loop))
    except KeyboardInterrupt:
        logger.info("BLE server interrupted and shutting down.")
    finally:
        heated_fabric_driver.stop()
        logger.info("BLE server stopped.")
