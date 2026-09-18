from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    expr,
    count,
    countDistinct,
    sum,
    round
)
from sedona.spark import SedonaContext


# ============================================================
# 1. START SPARK + SEDONA
# ============================================================

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("GeoPulse-Catchment-Analysis")
    .config(
        "spark.jars.packages",
        "org.apache.sedona:sedona-spark-shaded-4.1_2.13:1.9.1,"
        "org.datasyslab:geotools-wrapper:1.9.1-33.5"
    )
    .getOrCreate()
)

spark.sparkContext.setLogLevel("WARN")

sedona = SedonaContext.create(spark)


print("\n======================================")
print("GeoPulse Store Catchment Analysis")
print("======================================")


# ============================================================
# 2. LOAD GPS DATA
# ============================================================

gps_df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("data/raw/gps_pings.csv")
)

print("\nGPS records:", gps_df.count())


# ============================================================
# 3. LOAD STORE DATA
# ============================================================

stores_df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("data/sample/stores.csv")
)

print("Store records:", stores_df.count())


# ============================================================
# 4. CREATE SEDONA POINT GEOMETRIES
# ============================================================

gps_df = gps_df.withColumn(
    "geometry",
    expr(
        "ST_Point("
        "CAST(Longitude AS DOUBLE), "
        "CAST(Latitude AS DOUBLE)"
        ")"
    )
)

stores_df = stores_df.withColumn(
    "geometry",
    expr(
        "ST_Point("
        "CAST(Longitude AS DOUBLE), "
        "CAST(Latitude AS DOUBLE)"
        ")"
    )
)


# ============================================================
# 5. CREATE TEMPORARY VIEWS
# ============================================================

gps_df.createOrReplaceTempView("gps_points")
stores_df.createOrReplaceTempView("store_points")


# ============================================================
# 6. FIND GPS POINTS WITHIN 500 METERS
# ============================================================

spatial_matches = sedona.sql("""
    SELECT
        s.StoreID,
        s.StoreName,
        g.DeviceID,
        g.Latitude,
        g.Longitude,
        g.Timestamp,

        ST_DistanceSphere(
            s.geometry,
            g.geometry
        ) AS Distance_Meters

    FROM store_points s

    JOIN gps_points g

        ON ST_DistanceSphere(
            s.geometry,
            g.geometry
        ) <= 500
""")


# ============================================================
# 7. CREATE DISTANCE BANDS
# ============================================================

catchment_data = spatial_matches.withColumn(
    "Within_100m",
    (col("Distance_Meters") <= 100).cast("integer")
)

catchment_data = catchment_data.withColumn(
    "Within_250m",
    (col("Distance_Meters") <= 250).cast("integer")
)

catchment_data = catchment_data.withColumn(
    "Within_500m",
    (col("Distance_Meters") <= 500).cast("integer")
)


# ============================================================
# 8. STORE-LEVEL CATCHMENT SUMMARY
# ============================================================

catchment_summary = (
    catchment_data
    .groupBy(
        "StoreID",
        "StoreName"
    )
    .agg(
        count("*").alias("GPS_Observations"),

        countDistinct(
            "DeviceID"
        ).alias("Unique_Visitors"),

        sum(
            "Within_100m"
        ).alias("Observations_Within_100m"),

        sum(
            "Within_250m"
        ).alias("Observations_Within_250m"),

        sum(
            "Within_500m"
        ).alias("Observations_Within_500m")
    )
)


# ============================================================
# 9. CALCULATE PERCENTAGE WITHIN 250 METERS
# ============================================================

catchment_summary = catchment_summary.withColumn(
    "Percent_Within_250m",
    round(
        (
            col("Observations_Within_250m")
            / col("GPS_Observations")
        ) * 100,
        2
    )
)


# ============================================================
# 10. ORDER RESULTS
# ============================================================

catchment_summary = catchment_summary.orderBy(
    col("Percent_Within_250m").desc()
)


# ============================================================
# 11. DISPLAY RESULTS
# ============================================================

print("\n======================================")
print("STORE CATCHMENT SUMMARY")
print("======================================")

catchment_summary.show(
    truncate=False
)


# ============================================================
# 12. SAVE OUTPUT
# ============================================================

output_path = "data/sample/store_catchment_analysis"

(
    catchment_summary
    .coalesce(1)
    .write
    .mode("overwrite")
    .option("header", True)
    .csv(output_path)
)


print("\nCatchment analysis output saved to:")
print(output_path)


# ============================================================
# 13. STOP SPARK
# ============================================================

spark.stop()


print("\n======================================")
print("GeoPulse Catchment Analysis completed.")
print("======================================")