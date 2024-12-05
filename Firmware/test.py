from pressure_driver import get_pressure, is_wearing_jacket
from temperature import read_temp
from time import sleep, time
import RPi.GPIO as GPIO
import csv




# Transistor set to BCM 17
HEAT_PIN = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(HEAT_PIN, GPIO.OUT)

with open('temps.csv', 'w', newline='') as csvfile:
    start_time = time()
    fieldnames = ['time', 'temperature']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()

    try:
        GPIO.output(HEAT_PIN, GPIO.HIGH)

        while True:
            print(get_pressure(), is_wearing_jacket())
            temp = read_temp()
            writer.writerow({'time': time() - start_time, 'temperature': temp[0]})
            print(f"Temperature: {temp}")
            sleep(1)

    except KeyboardInterrupt:
        GPIO.output(HEAT_PIN, GPIO.LOW)

    finally:
        GPIO.cleanup()

# from digitalio import DigitalInOut, Direction, Pull
# import board

# # Set up the transistor on Pin 10, name it "base", and make it an output.
# base = DigitalInOut(board.D11)
# base.direction = Direction.OUTPUT


# while True:
#     base.value = True
#     sleep(0.01)