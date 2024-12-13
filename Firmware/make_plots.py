# Read the files experiment_*.txt, and create a plot for each file, save them. Here is an example of experiment_5.txt
"""
0,73.0616
3,73.175
5,73.175
8,73.175
10,73.175
13,73.2866
16,73.2866
18,73.4
21,73.4
24,73.5116
"""

import glob
import matplotlib.pyplot as plt


def read_data(file_path):
    with open(file_path, "r") as file:
        lines = file.readlines()
    data = [line.strip().split(",") for line in lines]
    data = [(int(x), float(y)) for x, y in data]
    return data


def create_plot(data, output_path):
    x, y = zip(*data)
    plt.figure()
    plt.plot(x, y, marker="o")
    plt.xlabel("Time")
    plt.ylabel("Value")
    plt.title("Experiment Data")
    plt.savefig(output_path)
    plt.close()


def main():
    files = glob.glob("experiment_*.txt")
    for file in files:
        data = read_data(file)
        output_path = file.replace(".txt", ".png")
        create_plot(data, output_path)


if __name__ == "__main__":
    main()
