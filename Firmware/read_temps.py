import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('temps.csv')

plt.plot(df["time"], df["temperature"])
plt.xlabel("Time (s)")
plt.ylabel("Temperature (c°)")
plt.title("Temperature of Heating Fabric over Time")

plt.savefig('temps.png')