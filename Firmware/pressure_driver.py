# Credits:
# AdaFruit ADC Tutorial: https://learn.adafruit.com/adafruit-4-channel-adc-breakouts/python-circuitpython
# AdaFruit FSR Tutorial: https://learn.adafruit.com/force-sensitive-resistor-fsr/using-an-fsr
# map_range function: User CrazyChucky in an answer for https://stackoverflow.com/questions/70643627/python-equivalent-for-arduinos-map-function

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
    while True:
        print(get_pressure())
        time.sleep(0.1)
