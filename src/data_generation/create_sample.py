import os
import pandas as pd


INPUT_PATH = "data/raw/gps_pings.csv"
OUTPUT_PATH = "data/sample/gps_pings_sample.csv"


def create_sample():

    print("Creating GeoPulse GPS sample dataset...")

    df = pd.read_csv(INPUT_PATH)

    # Select a small representative sample
    sample = (
        df.groupby("DeviceID", group_keys=False)
        .head(5)
        .head(1000)
    )

    os.makedirs(
        os.path.dirname(OUTPUT_PATH),
        exist_ok=True
    )

    sample.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print(f"Sample records created: {len(sample):,}")
    print(f"Output: {OUTPUT_PATH}")

    print("\nSample preview:")
    print(sample.head(10))


if __name__ == "__main__":
    create_sample()