import pandas as pd


INPUT_PATH = "data/raw/gps_pings.csv"


def validate_gps_data():

    print("GeoPulse GPS Data Validation")
    print("=" * 40)

    df = pd.read_csv(INPUT_PATH)

    print(f"Total records       : {len(df):,}")
    print(f"Unique devices      : {df['DeviceID'].nunique():,}")
    print(f"Columns             : {list(df.columns)}")

    # Required columns
    required_columns = [
        "DeviceID",
        "Latitude",
        "Longitude",
        "Timestamp"
    ]

    missing_columns = [
        column for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        print(f"\nMissing columns: {missing_columns}")
    else:
        print("\nRequired columns: PASS")

    # Missing values
    missing_values = df[required_columns].isnull().sum()

    print("\nMissing values:")
    print(missing_values)

    if missing_values.sum() == 0:
        print("Missing-value check: PASS")
    else:
        print("Missing-value check: REVIEW")

    # Latitude validation
    latitude_valid = df["Latitude"].between(-90, 90).all()

    print(
        f"\nLatitude range: "
        f"{df['Latitude'].min():.6f} to "
        f"{df['Latitude'].max():.6f}"
    )

    print(
        "Latitude validation:",
        "PASS" if latitude_valid else "FAIL"
    )

    # Longitude validation
    longitude_valid = df["Longitude"].between(-180, 180).all()

    print(
        f"Longitude range: "
        f"{df['Longitude'].min():.6f} to "
        f"{df['Longitude'].max():.6f}"
    )

    print(
        "Longitude validation:",
        "PASS" if longitude_valid else "FAIL"
    )

    # Timestamp validation
    df["Timestamp"] = pd.to_datetime(
        df["Timestamp"],
        errors="coerce"
    )

    invalid_timestamps = df["Timestamp"].isnull().sum()

    print(
        f"\nInvalid timestamps: {invalid_timestamps}"
    )

    if invalid_timestamps == 0:
        print("Timestamp validation: PASS")
    else:
        print("Timestamp validation: REVIEW")

    # Observations per device
    observations = df.groupby("DeviceID").size()

    print(
        f"\nMinimum observations per device: "
        f"{observations.min()}"
    )

    print(
        f"Maximum observations per device: "
        f"{observations.max()}"
    )

    print("\nDevice observation check:",
          "PASS" if observations.nunique() == 1 else "REVIEW")

    print("\nValidation completed.")


if __name__ == "__main__":
    validate_gps_data()