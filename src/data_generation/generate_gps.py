import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import yaml


# ---------------------------------------------------------
# GeoPulse - Synthetic GPS Mobility Data Generator
# ---------------------------------------------------------

# Load project configuration
CONFIG_PATH = "config/config.yaml"
STORES_PATH = "data/sample/stores.csv"
OUTPUT_PATH = "data/raw/gps_pings.csv"


def load_config():
    """Load project configuration from YAML."""
    with open(CONFIG_PATH, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def load_stores():
    """Load store locations."""
    return pd.read_csv(STORES_PATH)


def generate_timestamps(num_records, days=7):
    """Generate timestamps distributed across one week."""
    start_time = datetime.now() - timedelta(days=days)

    timestamps = []

    for _ in range(num_records):
        random_seconds = random.randint(0, days * 24 * 60 * 60)
        timestamp = start_time + timedelta(seconds=random_seconds)
        timestamps.append(timestamp)

    return timestamps


def generate_gps_data(config, stores):
    """Generate realistic synthetic mobile GPS observations."""

    num_devices = config["data"]["num_devices"]
    observations_per_device = config["data"]["observations_per_device"]

    center_lat = config["city"]["center_latitude"]
    center_lon = config["city"]["center_longitude"]

    total_records = num_devices * observations_per_device

    records = []

    # Generate data for each anonymized device
    for device_number in range(1, num_devices + 1):

        device_id = f"D{device_number:05d}"

        # Starting position around the city center
        latitude = center_lat + np.random.normal(0, 0.015)
        longitude = center_lon + np.random.normal(0, 0.015)

        # Generate observations for this device
        timestamps = generate_timestamps(observations_per_device)

        for timestamp in timestamps:

            hour = timestamp.hour

            # Higher probability of visiting commercial areas
            # during morning and evening peak hours.
            if 7 <= hour <= 10 or 17 <= hour <= 21:

                if random.random() < 0.45:

                    # Select one of the existing stores
                    store = stores.sample(1).iloc[0]

                    target_lat = store["Latitude"]
                    target_lon = store["Longitude"]

                    # Move closer to the store with small GPS noise
                    latitude = target_lat + np.random.normal(0, 0.002)
                    longitude = target_lon + np.random.normal(0, 0.002)

                else:
                    # Normal movement around current position
                    latitude += np.random.normal(0, 0.002)
                    longitude += np.random.normal(0, 0.002)

            else:

                # Normal movement outside peak hours
                latitude += np.random.normal(0, 0.003)
                longitude += np.random.normal(0, 0.003)

            # Keep generated points within a reasonable city boundary
            latitude = np.clip(
                latitude,
                center_lat - 0.04,
                center_lat + 0.04
            )

            longitude = np.clip(
                longitude,
                center_lon - 0.04,
                center_lon + 0.04
            )

            records.append(
                {
                    "DeviceID": device_id,
                    "Latitude": round(latitude, 6),
                    "Longitude": round(longitude, 6),
                    "Timestamp": timestamp
                }
            )

    # Convert to DataFrame
    gps_df = pd.DataFrame(records)

    # Sort by timestamp
    gps_df = gps_df.sort_values("Timestamp").reset_index(drop=True)

    return gps_df


def main():

    print("Starting GeoPulse GPS data generation...")

    # Load configuration and store data
    config = load_config()
    stores = load_stores()

    print(
        f"Devices: {config['data']['num_devices']}"
    )

    print(
        f"Observations per device: "
        f"{config['data']['observations_per_device']}"
    )

    # Generate GPS records
    gps_df = generate_gps_data(config, stores)

    # Create output directory
    os.makedirs(
        os.path.dirname(OUTPUT_PATH),
        exist_ok=True
    )

    # Save dataset
    gps_df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nGPS data generation completed.")

    print(
        f"Total records generated: {len(gps_df):,}"
    )

    print(
        f"Unique devices: "
        f"{gps_df['DeviceID'].nunique():,}"
    )

    print(
        f"Output file: {OUTPUT_PATH}"
    )

    print("\nFirst 10 records:")
    print(gps_df.head(10))


if __name__ == "__main__":
    main()