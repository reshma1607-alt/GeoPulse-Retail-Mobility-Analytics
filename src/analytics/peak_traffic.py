import pandas as pd


GPS_PATH = "data/raw/gps_pings.csv"
OUTPUT_PATH = "data/sample/peak_traffic_summary.csv"


def classify_period(hour):

    if 6 <= hour < 11:
        return "Morning Peak"

    if 11 <= hour < 17:
        return "Midday"

    if 17 <= hour < 22:
        return "Evening Peak"

    return "Night"


def main():

    print("=" * 60)
    print("GeoPulse - Peak Traffic Analysis")
    print("=" * 60)

    gps = pd.read_csv(GPS_PATH)

    gps["Timestamp"] = pd.to_datetime(
        gps["Timestamp"]
    )

    gps["Hour"] = gps["Timestamp"].dt.hour

    gps["TrafficPeriod"] = gps["Hour"].apply(
        classify_period
    )

    summary = (
        gps.groupby("TrafficPeriod")
        .agg(
            Observations=("DeviceID", "count"),
            UniqueDevices=("DeviceID", "nunique")
        )
        .reset_index()
    )

    period_order = [
        "Morning Peak",
        "Midday",
        "Evening Peak",
        "Night"
    ]

    summary["TrafficPeriod"] = pd.Categorical(
        summary["TrafficPeriod"],
        categories=period_order,
        ordered=True
    )

    summary = summary.sort_values(
        "TrafficPeriod"
    )

    summary.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nTRAFFIC PERIOD SUMMARY")
    print("-" * 50)
    print(summary.to_string(index=False))

    busiest = summary.loc[
        summary["Observations"].idxmax()
    ]

    print(
        f"\nBusiest period: "
        f"{busiest['TrafficPeriod']}"
    )

    print(
        f"Observations: "
        f"{busiest['Observations']:,}"
    )

    print(
        f"\nOutput saved to: {OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()