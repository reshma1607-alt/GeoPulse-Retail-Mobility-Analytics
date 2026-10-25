
from pathlib import Path

import h3
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = ROOT / "data" / "raw" / "gps_pings.csv"
OUTPUT_FILE = ROOT / "data" / "sample" / "h3_hourly_mobility.csv"

H3_RESOLUTION = 8


def main():
    print("GeoPulse Hourly H3 Mobility Analysis")
    print("-" * 45)

    gps = pd.read_csv(INPUT_FILE)

    required = {"DeviceID", "Latitude", "Longitude", "Timestamp"}
    missing = required - set(gps.columns)

    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    gps["Timestamp"] = pd.to_datetime(gps["Timestamp"], errors="coerce")
    gps["Latitude"] = pd.to_numeric(gps["Latitude"], errors="coerce")
    gps["Longitude"] = pd.to_numeric(gps["Longitude"], errors="coerce")

    gps = gps.dropna(
        subset=["DeviceID", "Latitude", "Longitude", "Timestamp"]
    )

    valid_coordinates = (
        gps["Latitude"].between(-90, 90)
        & gps["Longitude"].between(-180, 180)
    )
    gps = gps.loc[valid_coordinates].copy()

    if gps.empty:
        raise ValueError("No valid GPS records found.")

    gps["Hour"] = gps["Timestamp"].dt.hour

    gps["H3_Cell"] = [
        h3.latlng_to_cell(lat, lng, H3_RESOLUTION)
        for lat, lng in zip(gps["Latitude"], gps["Longitude"])
    ]

    summary = (
        gps.groupby(["Hour", "H3_Cell"], as_index=False)
        .agg(
            GPS_Observations=("DeviceID", "size"),
            Unique_Devices=("DeviceID", "nunique"),
            Center_Latitude=("Latitude", "mean"),
            Center_Longitude=("Longitude", "mean"),
        )
    )

    summary["H3_Resolution"] = H3_RESOLUTION

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(OUTPUT_FILE, index=False)

    print(f"Valid GPS records: {len(gps):,}")
    print(f"Hours represented: {gps['Hour'].nunique()}")
    print(f"Hourly cell records: {len(summary):,}")
    print(f"Output saved to: {OUTPUT_FILE}")
    print("\nHourly summary:")
    print(
        summary.groupby("Hour")["GPS_Observations"]
        .sum()
        .to_string()
    )
    print("\nHourly H3 analysis completed successfully.")


if __name__ == "__main__":
    main()
