
from pathlib import Path

import h3
import pandas as pd

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
INPUT_FILE = PROJECT_ROOT / "data" / "raw" / "gps_pings.csv"
OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "sample"
    / "h3_mobility_summary.csv"
)

# H3 resolution 8 gives relatively small cells suitable for local mobility analysis.
H3_RESOLUTION = 8


def main():
    print("GeoPulse H3 Mobility Analysis")
    print("-" * 40)

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"GPS dataset not found: {INPUT_FILE}"
        )

    gps = pd.read_csv(INPUT_FILE)

    required_columns = {"Latitude", "Longitude"}
    missing = required_columns - set(gps.columns)

    if missing:
        raise ValueError(
            f"Missing required GPS columns: {sorted(missing)}"
        )

    gps["Latitude"] = pd.to_numeric(
        gps["Latitude"], errors="coerce"
    )
    gps["Longitude"] = pd.to_numeric(
        gps["Longitude"], errors="coerce"
    )

    valid = (
        gps["Latitude"].between(-90, 90)
        & gps["Longitude"].between(-180, 180)
    )

    gps = gps.loc[valid].copy()

    if gps.empty:
        raise ValueError("No valid GPS coordinates found.")

    gps["H3_Cell"] = gps.apply(
        lambda row: h3.latlng_to_cell(
            row["Latitude"],
            row["Longitude"],
            H3_RESOLUTION,
        ),
        axis=1,
    )

    summary = (
        gps.groupby("H3_Cell")
        .agg(
            GPS_Observations=("H3_Cell", "size"),
            Unique_Devices=("DeviceID", "nunique"),
            Center_Latitude=("Latitude", "mean"),
            Center_Longitude=("Longitude", "mean"),
        )
        .reset_index()
        .sort_values(
            "GPS_Observations",
            ascending=False,
        )
    )

    summary["H3_Resolution"] = H3_RESOLUTION

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    summary.to_csv(OUTPUT_FILE, index=False)

    print(f"Valid GPS observations: {len(gps):,}")
    print(f"H3 resolution: {H3_RESOLUTION}")
    print(f"Hexagonal cells created: {len(summary):,}")
    print(f"Output saved to: {OUTPUT_FILE}")
    print("\nTop 10 cells:")
    print(summary.head(10).to_string(index=False))
    print("\nH3 mobility analysis completed successfully.")


if __name__ == "__main__":
    main()
