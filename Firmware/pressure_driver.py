from constants import MIN_PRESSURE_FOR_WEARING_JACKET
from threading import Condition

cv = Condition()

def _get_pressure():
    pass

def is_wearing_jacket():
    return _get_pressure() > MIN_PRESSURE_FOR_WEARING_JACKET

def low_power_mode():
    with cv:
        while not is_wearing_jacket():
            cv.wait()