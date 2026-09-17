from pyspark.sql import SparkSession
from pyspark.sql.functions import col, count, countDistinct, expr
from sedona.spark import SedonaContext


# ============================================================
# 1. START SPARK + SEDONA
# ============================================================

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("GeoPulse-Spatial-Join")
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
print("GeoPulse Spatial Join")
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
# 4. CREATE SEDONA GEOMETRY POINTS
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
# 6. SEDONA SPATIAL JOIN
#    500 METRE CATCHMENT
# ============================================================

spatial_join = sedona.sql("""
    SELECT
        s.StoreID,
        s.StoreName,
        g.DeviceID,
        g.Latitude,
        g.Longitude,
        g.Timestamp
    FROM store_points s
    JOIN gps_points g
        ON ST_DistanceSphere(
            s.geometry,
            g.geometry
        ) <= 500
""")


# ============================================================
# 7. COUNT MATCHED GPS OBSERVATIONS
# ============================================================

matched_count = spatial_join.count()

print("\nSpatial join completed.")
print("Matched GPS observations:", matched_count)


# ============================================================
# 8. DISPLAY SAMPLE RESULTS
# ============================================================

print("\nSample spatial join results:")

spatial_join.show(
    10,
    truncate=False
)


# ============================================================
# 9. STORE FOOTFALL SUMMARY
# ============================================================

footfall_summary = (
    spatial_join
    .groupBy(
        "StoreID",
        "StoreName"
    )
    .agg(
        count("*").alias("GPS_Observations"),
        countDistinct("DeviceID").alias("Unique_Visitors")
    )
    .orderBy(
        col("Unique_Visitors").desc()
    )
)


print("\n======================================")
print("STORE FOOTFALL SUMMARY")
print("======================================")

footfall_summary.show(
    truncate=False
)


# ============================================================
# 10. SAVE SPATIAL JOIN OUTPUT
# ============================================================

output_path = "data/sample/sedona_spatial_join"

(
    spatial_join
    .coalesce(1)
    .write
    .mode("overwrite")
    .option("header", True)
    .csv(output_path)
)


print("\nSpatial join output saved to:")
print(output_path)


# ============================================================
# 11. STOP SPARK
# ============================================================

spark.stop()


print("\n======================================")
print("GeoPulse Sedona processing completed.")
print("======================================")