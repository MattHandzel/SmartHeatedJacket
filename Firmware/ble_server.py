import sys
import logging
import asyncio
import threading

from typing import Any, Union

from bless import (
    BlessServer,
    GATTCharacteristicProperties,
    GATTAttributePermissions,
)

from heated_fabric_driver import heat_fabric
from pressure_driver import get_pressure
from temperature_driver import get_celcius

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(name=__name__)

# NOTE: Some systems require different synchronization methods.
trigger: Union[asyncio.Event, threading.Event]
if sys.platform in ["darwin", "win32"]:
    trigger = threading.Event()
else:
    trigger = asyncio.Event()


def set_temperature(_, value: Any, **kwargs):
    try:
        temperature = int(value.decode('utf-8'))
        logger.debug(f"Setting temperature to: {temperature}")
        heat_fabric(temperature)
    except ValueError as e:
        logger.error(f"Invalid temperature value received: {value}, error: {e}")


def get_temperature_and_pressure(_, **kwargs) -> bytearray:
    temperature = get_celcius()
    pressure = get_pressure()
    data_str = f"{temperature}, {pressure}"
    logger.debug(f"Read data: {data_str}")
    return data_str.encode('utf-8')


async def run(loop):
    trigger.clear()

    # Instantiate the server
    server = BlessServer(name="temperature_server", loop=loop)

    # Add Service
    my_service_uuid = "a07498ca-ad5b-474e-940d-16f1fbe7e8cd".upper()
    await server.add_new_service(my_service_uuid)

    # Add a Characteristic to the service
    my_char_uuid = "51FF12BB-3ED8-46E5-B4F9-D64E2FEC021B".upper()
    char_flags = (
        GATTCharacteristicProperties.write
        | GATTCharacteristicProperties.read
        | GATTCharacteristicProperties.indicate
    )
    permissions = (
        GATTAttributePermissions.writeable
        | GATTAttributePermissions.readable
    )

    char = await server.add_new_characteristic(
        my_service_uuid,
        my_char_uuid,
        char_flags,
        bytearray(),  # Initialize with empty bytearray
        permissions
    )

    # Set read and write handlers on the characteristic
    char.read_request_func = get_temperature_and_pressure
    char.write_request_func = set_temperature

    logger.debug(server.get_characteristic(my_char_uuid))
    await server.start()
    logger.debug("Advertising")
    logger.info(f"Write '0xF' to the advertised characteristic: {my_char_uuid}")

    if isinstance(trigger, threading.Event):
        trigger.wait()
    else:
        await trigger.wait()

    await asyncio.sleep(2)
    logger.debug("Updating")
    updated_value = get_temperature_and_pressure(None)
    server.update_value(my_service_uuid, my_char_uuid, updated_value)
    await asyncio.sleep(5)
    await server.stop()


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop))
