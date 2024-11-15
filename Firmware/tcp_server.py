import socket
from pressure_driver import is_wearing_jacket, low_power_mode
from heated_fabric_driver import heat_fabric

# Set up TCP socket
TCP_IP = "0.0.0.0"
TCP_PORT = 8000

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind((TCP_IP, TCP_PORT))




while True:
    # go into low power mode if the user isn't wearing the jacket
    if not is_wearing_jacket():
        low_power_mode()

    # Intensity value between 1-10
    intensity, _ = sock.recvfrom(1024)
    intensity = intensity.decode("utf-8")
    
    heat_fabric(intensity)
