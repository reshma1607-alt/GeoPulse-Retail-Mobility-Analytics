from pyspark.sql import SparkSession
from pyspark.sql.functions import col, expr, round, avg, min, max, countDistinct
from sedona.spark import SedonaContext


# ============================================================
# 1. START SPARK + SEDONA
# ============================================================

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("GeoPulse-Distance-Analysis")
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
print("GeoPulse Distance Analysis")
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
# 6. FIND GPS POINTS WITHIN 500 METERS OF STORES
# ============================================================

spatial_matches = sedona.sql("""
    SELECT
        s.StoreID,
        s.StoreName,
        g.DeviceID,
        g.Latitude,
        g.Longitude,
        g.Timestamp,
        s.geometry AS store_geometry,
        g.geometry AS gps_geometry
    FROM store_points s
    JOIN gps_points g
        ON ST_DistanceSphere(
            s.geometry,
            g.geometry
        ) <= 500
""")


# ============================================================
# 7. CALCULATE DISTANCE IN METERS
# ============================================================

distance_analysis = spatial_matches.withColumn(
    "Distance_Meters",
    expr(
        "ST_DistanceSphere("
        "store_geometry, "
        "gps_geometry"
        ")"
    )
)


# ============================================================
# 8. ROUND DISTANCE
# ============================================================

distance_analysis = distance_analysis.withColumn(
    "Distance_Meters",
    round(col("Distance_Meters"), 2)
)


# ============================================================
# 9. DISPLAY SAMPLE RESULTS
# ============================================================

print("\n======================================")
print("SAMPLE DISTANCE RESULTS")
print("======================================")

distance_analysis.select(
    "StoreID",
    "StoreName",
    "DeviceID",
    "Latitude",
    "Longitude",
    "Timestamp",
    "Distance_Meters"
).show(10, truncate=False)


# ============================================================
# 10. STORE DISTANCE SUMMARY
# ============================================================

store_distance_summary = (
    distance_analysis
    .groupBy(
        "StoreID",
        "StoreName"
    )
    .agg(
        countDistinct("DeviceID").alias("Unique_Visitors"),
        round(avg("Distance_Meters"), 2).alias("Average_Distance_Meters"),
        round(min("Distance_Meters"), 2).alias("Minimum_Distance_Meters"),
        round(max("Distance_Meters"), 2).alias("Maximum_Distance_Meters")
    )
    .orderBy(
        col("Average_Distance_Meters")
    )
)


print("\n======================================")
print("STORE DISTANCE SUMMARY")
print("======================================")

store_distance_summary.show(truncate=False)


# ============================================================
# 11. SAVE OUTPUT
# ============================================================

output_path = "data/sample/store_distance_analysis"

(
    distance_analysis
    .select(
        "StoreID",
        "StoreName",
        "DeviceID",
        "Latitude",
        "Longitude",
        "Timestamp",
        "Distance_Meters"
    )
    .coalesce(1)
    .write
    .mode("overwrite")
    .option("header", True)
    .csv(output_path)
)


print("\nDistance analysis output saved to:")
print(output_path)


# ============================================================
# 12. STOP SPARK
# ============================================================

spark.stop()


print("\n======================================")
print("GeoPulse Distance Analysis completed.")
print("======================================")