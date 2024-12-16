# Credit:
# AdaFruit Conductive Heater Fabric Tutorial: https://learn.adafruit.com/experimenting-with-conductive-heater-fabric/how-do-i-power-it

# heated_fabric_driver.py

from pwmio import PWMOut
from temperature_driver import get_fahrenheit
import board
import time
from loguru import logger


HEAT_PIN = board.D13


class HeatedFabricDriver:
    def __init__(self, pin, kP, kI, kD, kF, verbose=1, temperature_threshold=1):
        self.kP = kP
        self.kI = kI
        self.kD = kD
        self.kF = kF
        self.previous_update_time = None
        self.integral = 0
        self.previous_error = 0
        self.max_output = 100

        self.base = PWMOut(pin, frequency=5000, duty_cycle=0)  # PWM output
        self.verbose = verbose
        self.temperature_threshold = temperature_threshold
        self.setpoint = None
        self.is_running = False

        self.start_time = None

    def heat_fabric(self, intensity):
        # Intensity should be between 0-100%
        intensity = max(0, min(self.max_output, intensity))  # Clamp to range [0, 100]
        duty_cycle = int(intensity * 65535 / self.max_output)  # Scale to PWM range
        self.base.duty_cycle = duty_cycle
        # if self.verbose > 1:
        #     logger.debug(
        #         f"Heating fabric: Intensity={intensity}%, Duty Cycle={duty_cycle}"
        #     )

    def update_temperature(self, temp):
        self.setpoint = temp
        self.integral = 0
        self.previous_error = 0
        self.start_time = time.time()
        self.is_running = True
        # logger.info(f"Temperature setpoint updated to {temp}°F")

    def stop(self):
        self.base.duty_cycle = 0
        self.integral = 0
        self.is_running = False
        self.previous_error = 0
        # logger.info("HeatedFabricDriver stopped and heating turned off.")

    def update(self):
        if self.is_running is False:
            logger.debug("The heated fabric driver is not running :(")
            return
        if self.previous_update_time is None:
            self.previous_update_time = time.monotonic()
            logger.debug("Initial update call. Setting previous_update_time.")
            return

        current_time = time.monotonic()
        delta_time = current_time - self.previous_update_time

        if delta_time <= 0:
            logger.warning("Delta time is non-positive. Skipping this update cycle.")
            return

        current_temp = get_fahrenheit()
        error = self.setpoint - current_temp
        # logger.debug(
        #     f"Current Temperature: {current_temp}°F, Setpoint: {self.setpoint}°F, Error: {error}°F"
        # )
        if error > 5:
            output = 100
        else:

            # if abs(error) < self.temperature_threshold:
            #     error = 0
            #     logger.debug("Error within threshold. Setting error to 0.")

            # PID controller output
            if delta_time > 10:
                delta_time = 1
            self.integral += error * delta_time
            derivative = (error - self.previous_error) / delta_time
            output = self.kP * error + self.kI * self.integral + self.kD * derivative

            # Clamp output to [0, max_output]
            output = max(0, min(self.max_output, output))
            # logger.debug(
            #     f"PID Computation - P: {self.kP * error}, I: {self.kI * self.integral}, D: {self.kD * derivative}, Output: {output}"
            # )

        self.previous_output = output

        # Adjust heating intensity based on PID output
        self.heat_fabric(output)
        self.previous_error = error
        self.previous_update_time = current_time


if __name__ == "__main__":
    # Collect some graphs, tune PID
    heated_fabric_driver = HeatedFabricDriver(pin=HEAT_PIN, kP=20, kI=0.6, kD=30, kF=0)
    start_time = time.time()

    voltage = 12
    file = open(f"experiment_pid_{voltage}_2.txt", "w")

    heated_fabric_driver.update_temperature(90)
    while round(time.time() - start_time) < 300:  # 5 minutes

        heated_fabric_driver.update()

        # print temp
        file.write(f"{round(time.time() - start_time)},{get_fahrenheit()}\n")

        print(round(time.time() - start_time), get_fahrenheit())

        time.sleep(0.5)
