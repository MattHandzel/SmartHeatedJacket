# Credit:
# Server adapted from kevincar, https://github.com/kevincar/bless/blob/master/examples/server.py

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
    temperature = int(value.decode('utf-8'))
    heat_fabric(temperature)

def get_temperature_and_pressure(_, **kwargs) -> bytearray:
    return f"{get_celcius()}, {get_pressure()}".encode('utf-8')

async def run(loop):
    trigger.clear()

    # Instantiate the server
    server = BlessServer(name="temperature_server", loop=loop)
    server.read_request_func = get_temperature_and_pressure
    server.write_request_func = set_temperature

    # Add Service
    my_service_uuid = "A07498CA-AD5B-474E-940D-16F1FBE7E8CD"
    await server.add_new_service(my_service_uuid)

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

    logger.debug(server.get_characteristic(my_char_uuid))
    await server.start()
    logger.debug("Advertising")
    logger.info(f"Write '0xF' to the advertised characteristic: {my_char_uuid}")
    if trigger.__module__ == "threading":
        trigger.wait()
    else:
        await trigger.wait()

    await asyncio.sleep(2)
    logger.debug("Updating")
    server.get_characteristic(my_char_uuid)
    server.update_value(my_service_uuid, "51FF12BB-3ED8-46E5-B4F9-D64E2FEC021B")
    await asyncio.sleep(5)
    await server.stop()


loop = asyncio.get_event_loop()
loop.run_until_complete(run(loop))