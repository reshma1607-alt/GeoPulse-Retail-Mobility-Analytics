import pandas as pd


GPS_PATH = "data/raw/gps_pings.csv"
STORES_PATH = "data/sample/stores.csv"


def load_data():
    """Load GPS and store datasets."""

    gps = pd.read_csv(GPS_PATH)
    stores = pd.read_csv(STORES_PATH)

    gps["Timestamp"] = pd.to_datetime(gps["Timestamp"])

    return gps, stores


def create_time_features(gps):
    """Create useful time-based features."""

    gps["Date"] = gps["Timestamp"].dt.date
    gps["Hour"] = gps["Timestamp"].dt.hour
    gps["Day"] = gps["Timestamp"].dt.day_name()

    return gps


def calculate_summary(gps):
    """Calculate overall mobility statistics."""

    summary = {
        "total_observations": len(gps),
        "unique_devices": gps["DeviceID"].nunique(),
        "unique_dates": gps["Date"].nunique(),
        "latitude_min": gps["Latitude"].min(),
        "latitude_max": gps["Latitude"].max(),
        "longitude_min": gps["Longitude"].min(),
        "longitude_max": gps["Longitude"].max(),
    }

    return summary


def calculate_hourly_traffic(gps):
    """Calculate number of GPS observations by hour."""

    hourly = (
        gps.groupby("Hour")
        .size()
        .reset_index(name="Observations")
        .sort_values("Hour")
    )

    return hourly


def calculate_daily_traffic(gps):
    """Calculate number of GPS observations by date."""

    daily = (
        gps.groupby("Date")
        .size()
        .reset_index(name="Observations")
        .sort_values("Date")
    )

    return daily


def calculate_peak_periods(gps):
    """Calculate morning and evening traffic."""

    morning = gps[
        gps["Hour"].between(7, 10)
    ]

    evening = gps[
        gps["Hour"].between(17, 21)
    ]

    peak_summary = {
        "morning_observations": len(morning),
        "evening_observations": len(evening),
    }

    return peak_summary


def calculate_store_proximity(gps, stores):
    """
    Count GPS observations located close to each store.

    Approximation:
    0.001 degree latitude/longitude is treated as
    approximately 100 meters for this synthetic dataset.
    """

    results = []

    for _, store in stores.iterrows():

        lat_difference = (
            gps["Latitude"] - store["Latitude"]
        )

        lon_difference = (
            gps["Longitude"] - store["Longitude"]
        )

        distance_approx = (
            (lat_difference ** 2 + lon_difference ** 2)
            ** 0.5
        )

        nearby = gps[
            distance_approx <= 0.005
        ]

        results.append(
            {
                "StoreID": store["StoreID"],
                "StoreName": store["StoreName"],
                "NearbyObservations": len(nearby),
                "UniqueDevices": nearby["DeviceID"].nunique(),
            }
        )

    return pd.DataFrame(results)


def main():

    print("=" * 60)
    print("GeoPulse - Mobility Analytics Summary")
    print("=" * 60)

    gps, stores = load_data()

    gps = create_time_features(gps)

    # Overall summary
    summary = calculate_summary(gps)

    print("\nOVERALL MOBILITY SUMMARY")
    print("-" * 40)

    for key, value in summary.items():

        if isinstance(value, float):
            print(f"{key}: {value:.6f}")

        else:
            print(f"{key}: {value}")

    # Hourly traffic
    hourly = calculate_hourly_traffic(gps)

    print("\nHOURLY TRAFFIC")
    print("-" * 40)
    print(hourly.to_string(index=False))

    # Daily traffic
    daily = calculate_daily_traffic(gps)

    print("\nDAILY TRAFFIC")
    print("-" * 40)
    print(daily.to_string(index=False))

    # Peak traffic
    peak = calculate_peak_periods(gps)

    print("\nPEAK PERIOD ANALYSIS")
    print("-" * 40)

    print(
        f"Morning observations (07:00-10:00): "
        f"{peak['morning_observations']:,}"
    )

    print(
        f"Evening observations (17:00-21:00): "
        f"{peak['evening_observations']:,}"
    )

    # Store proximity
    store_analysis = calculate_store_proximity(
        gps,
        stores
    )

    print("\nSTORE PROXIMITY ANALYSIS")
    print("-" * 40)
    print(store_analysis.to_string(index=False))

    print("\nMobility analysis completed successfully.")


if __name__ == "__main__":
    main()