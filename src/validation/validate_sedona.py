import pandas as pd
from pathlib import Path


print("\n======================================")
print("GeoPulse Sedona Data Validation")
print("======================================")


BASE_PATH = Path("data/sample")


def load_output(folder_name):
    folder = BASE_PATH / folder_name
    files = list(folder.glob("*.csv"))

    if not files:
        raise FileNotFoundError(
            f"No CSV file found in {folder}"
        )

    return pd.read_csv(files[0])


# ============================================================
# 1. LOAD DATA
# ============================================================

spatial_df = load_output(
    "sedona_spatial_join"
)

distance_df = load_output(
    "store_distance_analysis"
)

catchment_df = load_output(
    "store_catchment_analysis"
)

overlap_df = load_output(
    "visitor_overlap_sedona"
)

cannibalization_df = load_output(
    "cannibalization_sedona"
)


# ============================================================
# 2. SPATIAL JOIN CHECK
# ============================================================

print("\nSpatial Join Validation")
print("--------------------------------------")

print(
    "Total matched observations:",
    len(spatial_df)
)

print(
    "Missing StoreID:",
    spatial_df["StoreID"].isna().sum()
)

print(
    "Missing DeviceID:",
    spatial_df["DeviceID"].isna().sum()
)


# ============================================================
# 3. DISTANCE CHECK
# ============================================================

print("\nDistance Validation")
print("--------------------------------------")

invalid_distance = distance_df[
    (distance_df["Distance_Meters"] < 0) |
    (distance_df["Distance_Meters"] > 500)
]

missing_distance = (
    distance_df["Distance_Meters"]
    .isna()
    .sum()
)

print(
    "Missing distances:",
    missing_distance
)

print(
    "Distances outside 500m:",
    len(invalid_distance)
)


# ============================================================
# 4. CATCHMENT CHECK
# ============================================================

print("\nCatchment Validation")
print("--------------------------------------")

print(
    "Stores analysed:",
    catchment_df["StoreID"].nunique()
)

print(
    "Missing StoreID:",
    catchment_df["StoreID"].isna().sum()
)

percentage_column = "Percent_Within_250m"

invalid_percentage = catchment_df[
    (catchment_df[percentage_column] < 0) |
    (catchment_df[percentage_column] > 100)
]

print(
    "Invalid percentage values:",
    len(invalid_percentage)
)


# ============================================================
# 5. VISITOR OVERLAP CHECK
# ============================================================

print("\nVisitor Overlap Validation")
print("--------------------------------------")

duplicate_pairs = overlap_df.duplicated(
    subset=["Store_A", "Store_B"]
).sum()

invalid_shared = overlap_df[
    (overlap_df["Shared_Visitors"] < 0) |
    (
        overlap_df["Shared_Visitors"]
        > overlap_df[["Visitors_A", "Visitors_B"]].min(axis=1)
    )
]

print(
    "Store pairs:",
    len(overlap_df)
)

print(
    "Duplicate store pairs:",
    duplicate_pairs
)

print(
    "Invalid shared visitor counts:",
    len(invalid_shared)
)


# ============================================================
# 6. CANNIBALIZATION CHECK
# ============================================================

print("\nCannibalization Validation")
print("--------------------------------------")

invalid_cannibalization = cannibalization_df[
    (cannibalization_df["Cannibalization_Indicator"] < 0) |
    (cannibalization_df["Cannibalization_Indicator"] > 100)
]

print(
    "Store pairs:",
    len(cannibalization_df)
)

print(
    "Invalid indicator values:",
    len(invalid_cannibalization)
)


# ============================================================
# 7. FINAL RESULT
# ============================================================

checks = {
    "Spatial missing StoreID":
        spatial_df["StoreID"].isna().sum() == 0,

    "Spatial missing DeviceID":
        spatial_df["DeviceID"].isna().sum() == 0,

    "Invalid distances":
        len(invalid_distance) == 0,

    "Missing distances":
        missing_distance == 0,

    "Invalid catchment percentages":
        len(invalid_percentage) == 0,

    "Duplicate overlap pairs":
        duplicate_pairs == 0,

    "Invalid shared visitors":
        len(invalid_shared) == 0,

    "Invalid cannibalization indicators":
        len(invalid_cannibalization) == 0
}


print("\n======================================")
print("VALIDATION RESULTS")
print("======================================")


all_passed = True


for check_name, passed in checks.items():

    status = "PASS" if passed else "FAIL"

    print(
        f"{check_name}: {status}"
    )

    if not passed:
        all_passed = False


print("\n======================================")

if all_passed:
    print("All Sedona validation checks passed.")
else:
    print("Some Sedona validation checks failed.")

print("======================================")