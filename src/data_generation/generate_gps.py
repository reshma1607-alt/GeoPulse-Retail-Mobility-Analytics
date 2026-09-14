import numpy as np
import pandas as pd


def create_device_ids(num_devices):
    """Create anonymous device IDs."""
    return [f"D{i:05d}" for i in range(1, num_devices + 1)]


if __name__ == "__main__":
    devices = create_device_ids(10)

    device_df = pd.DataFrame({
        "DeviceID": devices
    })

    print(device_df)