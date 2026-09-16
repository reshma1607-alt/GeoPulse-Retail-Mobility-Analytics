import pandas as pd
import numpy as np
import yaml


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two geographic coordinates
    using the Haversine formula.

    Returns distance in meters.
    """

    lat1_rad = np.radians(lat1)
    lat2_rad = np.radians(lat2)

    delta_lat = lat2_rad - lat1_rad
    delta_lon = np.radians(lon2 - lon1)

    a = (
        np.sin(delta_lat / 2) ** 2
        + np.cos(lat1_rad)
        * np.cos(lat2_rad)
        * np.sin(delta_lon / 2) ** 2
    )

    c = 2 * np.arcsin(np.sqrt(a))

    earth_radius = 6371000

    return earth_radius * c


# Load configuration
with open("config/config.yaml", "r") as file:
    config = yaml.safe_load(file)

catchment_radius = config["stores"]["catchment_radius_meters"]

# Load GPS data
gps = pd.read_csv("data/raw/gps_pings.csv")

# Convert timestamp
gps["Timestamp"] = pd.to_datetime(gps["Timestamp"])

# Create date and hour fields
gps["Date"] = gps["Timestamp"].dt.date
gps["Hour"] = gps["Timestamp"].dt.hour

# Load store data
stores = pd.read_csv("data/sample/stores.csv")

results = []

for _, store in stores.iterrows():

    distances = haversine_distance(
        gps["Latitude"],
        gps["Longitude"],
        store["Latitude"],
        store["Longitude"]
    )

    store_visits = gps[distances <= catchment_radius].copy()

    if store_visits.empty:
        continue

    grouped = (
        store_visits
        .groupby(["Date", "Hour"])
        .agg(
            GPSObservations=("DeviceID", "count"),
            UniqueVisitors=("DeviceID", "nunique")
        )
        .reset_index()
    )

    grouped["StoreID"] = store["StoreID"]
    grouped["StoreName"] = store["StoreName"]

    results.append(grouped)


if results:
    result_df = pd.concat(results, ignore_index=True)

    result_df = result_df[
        [
            "Date",
            "Hour",
            "StoreID",
            "StoreName",
            "GPSObservations",
            "UniqueVisitors"
        ]
    ]

    result_df.to_csv(
        "data/sample/hourly_footfall.csv",
        index=False
    )

    print("Hourly footfall analysis completed.")
    print(result_df.head(10))

else:
    print("No store visits found within the catchment radius.")