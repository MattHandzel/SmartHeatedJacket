# Credit:
# AdaFruit Conductive Heater Fabric Tutorial: https://learn.adafruit.com/experimenting-with-conductive-heater-fabric/how-do-i-power-it

from digitalio import DigitalInOut, Direction
import board

# Set up the transistor on Pin 10, name it "base", and make it an output.
base = DigitalInOut(board.D10)
base.direction = Direction.OUTPUT

def heat_fabric(intensity):
    pass