from temperature import read_temp

def get_celcius():
    celcius, _ = read_temp()
    return celcius

def get_fahrenheit():
    _, fahrenheit = read_temp()
    return fahrenheit