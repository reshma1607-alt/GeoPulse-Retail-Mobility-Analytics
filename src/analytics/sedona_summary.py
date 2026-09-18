import pandas as pd
from pathlib import Path


print("\n======================================")
print("GeoPulse Sedona Analytics Summary")
print("======================================")


# ============================================================
# 1. PATHS
# ============================================================

base_path = Path("data/sample")


# ============================================================
# 2. HELPER FUNCTION
# ============================================================

def load_spark_output(folder_name):
    folder = base_path / folder_name

    files = list(folder.glob("*.csv"))

    if not files:
        raise FileNotFoundError(
            f"No CSV output found in: {folder}"
        )

    return pd.read_csv(files[0])


# ============================================================
# 3. LOAD OUTPUTS
# ============================================================

print("\nLoading Sedona outputs...")

spatial_df = load_spark_output(
    "sedona_spatial_join"
)

distance_df = load_spark_output(
    "store_distance_analysis"
)

catchment_df = load_spark_output(
    "store_catchment_analysis"
)

overlap_df = load_spark_output(
    "visitor_overlap_sedona"
)

cannibalization_df = load_spark_output(
    "cannibalization_sedona"
)


print("All Sedona outputs loaded successfully.")


# ============================================================
# 4. STORE-LEVEL SPATIAL SUMMARY
# ============================================================

store_summary = (
    spatial_df
    .groupby(["StoreID", "StoreName"])
    .agg(
        GPS_Observations=("DeviceID", "count"),
        Unique_Visitors=("DeviceID", "nunique")
    )
    .reset_index()
)


# ============================================================
# 5. DISTANCE SUMMARY
# ============================================================

distance_summary = (
    distance_df
    .groupby(["StoreID", "StoreName"])
    .agg(
        Average_Distance_Meters=("Distance_Meters", "mean"),
        Minimum_Distance_Meters=("Distance_Meters", "min"),
        Maximum_Distance_Meters=("Distance_Meters", "max")
    )
    .reset_index()
)


distance_summary[
    [
        "Average_Distance_Meters",
        "Minimum_Distance_Meters",
        "Maximum_Distance_Meters"
    ]
] = distance_summary[
    [
        "Average_Distance_Meters",
        "Minimum_Distance_Meters",
        "Maximum_Distance_Meters"
    ]
].round(2)


# ============================================================
# 6. CATCHMENT SUMMARY
# ============================================================

print("\nCatchment output columns:")
print(list(catchment_df.columns))


catchment_columns = [
    "StoreID"
]


# Find the percentage column automatically
percentage_columns = [
    column
    for column in catchment_df.columns
    if "Percent" in column
]


if percentage_columns:

    catchment_columns.append(
        percentage_columns[0]
    )

    catchment_summary = catchment_df[
        catchment_columns
    ].copy()

else:

    catchment_summary = catchment_df[
        ["StoreID"]
    ].copy()


# ============================================================
# 7. MERGE DISTANCE RESULTS
# ============================================================

store_summary = store_summary.merge(
    distance_summary,
    on=["StoreID", "StoreName"],
    how="left"
)


# ============================================================
# 8. MERGE CATCHMENT RESULTS
# ============================================================

store_summary = store_summary.merge(
    catchment_summary,
    on="StoreID",
    how="left"
)


# ============================================================
# 9. SORT STORES BY UNIQUE VISITORS
# ============================================================

store_summary = store_summary.sort_values(
    "Unique_Visitors",
    ascending=False
)


store_summary["Visitor_Rank"] = range(
    1,
    len(store_summary) + 1
)


# ============================================================
# 10. DISPLAY STORE SUMMARY
# ============================================================

print("\n======================================")
print("STORE-LEVEL SEDONA SUMMARY")
print("======================================")

print(
    store_summary.to_string(index=False)
)


# ============================================================
# 11. VISITOR OVERLAP SUMMARY
# ============================================================

total_pairs = len(overlap_df)

if "Overlap_Percentage" in overlap_df.columns:

    average_overlap = round(
        overlap_df["Overlap_Percentage"].mean(),
        2
    )

else:

    average_overlap = None


print("\n======================================")
print("VISITOR OVERLAP SUMMARY")
print("======================================")

print(
    "Store pairs analysed:",
    total_pairs
)

if average_overlap is not None:

    print(
        "Average overlap percentage:",
        average_overlap
    )


# ============================================================
# 12. CANNIBALIZATION SUMMARY
# ============================================================

if "Indicator_Category" in cannibalization_df.columns:

    high_count = (
        cannibalization_df[
            cannibalization_df["Indicator_Category"] == "High"
        ].shape[0]
    )

    medium_count = (
        cannibalization_df[
            cannibalization_df["Indicator_Category"] == "Medium"
        ].shape[0]
    )

    low_count = (
        cannibalization_df[
            cannibalization_df["Indicator_Category"] == "Low"
        ].shape[0]
    )

else:

    high_count = 0
    medium_count = 0
    low_count = 0


print("\n======================================")
print("CANNIBALIZATION SUMMARY")
print("======================================")

print(
    "High indicator pairs:",
    high_count
)

print(
    "Medium indicator pairs:",
    medium_count
)

print(
    "Low indicator pairs:",
    low_count
)


# ============================================================
# 13. SAVE CONSOLIDATED OUTPUT
# ============================================================

output_path = (
    base_path /
    "geopulse_sedona_summary.csv"
)


store_summary.to_csv(
    output_path,
    index=False
)


# ============================================================
# 14. COMPLETION MESSAGE
# ============================================================

print("\n======================================")
print("SUMMARY SAVED")
print("======================================")

print(
    "Output:",
    output_path
)


print("\n======================================")
print("GeoPulse Sedona Summary completed.")
print("======================================")