import pandas as pd
import numpy as np
import yaml
from itertools import combinations


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

# Load store data
stores = pd.read_csv("data/sample/stores.csv")

# Create visitor sets for each store
store_visitors = {}

for _, store in stores.iterrows():

    distances = haversine_distance(
        gps["Latitude"],
        gps["Longitude"],
        store["Latitude"],
        store["Longitude"]
    )

    store_visits = gps[distances <= catchment_radius]

    visitors = set(store_visits["DeviceID"].unique())

    store_visitors[store["StoreID"]] = {
        "StoreName": store["StoreName"],
        "Visitors": visitors
    }


# Calculate visitor overlap between store pairs
results = []

store_ids = list(store_visitors.keys())

for store_a, store_b in combinations(store_ids, 2):

    visitors_a = store_visitors[store_a]["Visitors"]
    visitors_b = store_visitors[store_b]["Visitors"]

    shared_visitors = visitors_a.intersection(visitors_b)
    union_visitors = visitors_a.union(visitors_b)

    visitor_count_a = len(visitors_a)
    visitor_count_b = len(visitors_b)
    shared_count = len(shared_visitors)

    if len(union_visitors) > 0:
        overlap_percentage = (
            shared_count / len(union_visitors)
        ) * 100
    else:
        overlap_percentage = 0

    results.append({
        "StoreA": store_a,
        "StoreAName": store_visitors[store_a]["StoreName"],
        "StoreB": store_b,
        "StoreBName": store_visitors[store_b]["StoreName"],
        "VisitorsStoreA": visitor_count_a,
        "VisitorsStoreB": visitor_count_b,
        "SharedVisitors": shared_count,
        "OverlapPercentage": round(overlap_percentage, 2)
    })


# Convert results to DataFrame
result_df = pd.DataFrame(results)

# Save output
result_df.to_csv(
    "data/sample/visitor_overlap.csv",
    index=False
)

print("Visitor overlap analysis completed.")
print(result_df)