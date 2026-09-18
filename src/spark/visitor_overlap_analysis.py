from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    expr,
    countDistinct,
    round
)
from sedona.spark import SedonaContext


# ============================================================
# 1. START SPARK + SEDONA
# ============================================================

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("GeoPulse-Visitor-Overlap")
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
print("GeoPulse Visitor Overlap Analysis")
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
# 4. CREATE SEDONA GEOMETRIES
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
# 6. FIND VISITS WITHIN 500 METERS
# ============================================================

store_visits = sedona.sql("""
    SELECT DISTINCT
        s.StoreID,
        s.StoreName,
        g.DeviceID
    FROM store_points s
    JOIN gps_points g
        ON ST_DistanceSphere(
            s.geometry,
            g.geometry
        ) <= 500
""")


# ============================================================
# 7. UNIQUE VISITORS PER STORE
# ============================================================

store_visitors = (
    store_visits
    .groupBy(
        "StoreID",
        "StoreName"
    )
    .agg(
        countDistinct("DeviceID").alias("Unique_Visitors")
    )
)


print("\n======================================")
print("UNIQUE VISITORS PER STORE")
print("======================================")

store_visitors.orderBy(
    col("StoreID")
).show(truncate=False)


# ============================================================
# 8. CREATE STORE PAIRS
# ============================================================

store_a = store_visits.alias("a")
store_b = store_visits.alias("b")


visitor_overlap = (
    store_a
    .join(
        store_b,
        (
            (col("a.DeviceID") == col("b.DeviceID")) &
            (col("a.StoreID") < col("b.StoreID"))
        )
    )
    .select(
        col("a.StoreID").alias("Store_A"),
        col("a.StoreName").alias("Store_A_Name"),
        col("b.StoreID").alias("Store_B"),
        col("b.StoreName").alias("Store_B_Name"),
        col("a.DeviceID").alias("DeviceID")
    )
)


# ============================================================
# 9. COUNT SHARED VISITORS
# ============================================================

overlap_summary = (
    visitor_overlap
    .groupBy(
        "Store_A",
        "Store_A_Name",
        "Store_B",
        "Store_B_Name"
    )
    .agg(
        countDistinct("DeviceID").alias("Shared_Visitors")
    )
)


# ============================================================
# 10. ADD STORE VISITOR COUNTS
# ============================================================

store_counts_a = (
    store_visitors
    .select(
        col("StoreID").alias("A_ID"),
        col("Unique_Visitors").alias("Visitors_A")
    )
)

store_counts_b = (
    store_visitors
    .select(
        col("StoreID").alias("B_ID"),
        col("Unique_Visitors").alias("Visitors_B")
    )
)


overlap_summary = (
    overlap_summary
    .join(
        store_counts_a,
        col("Store_A") == col("A_ID")
    )
    .join(
        store_counts_b,
        col("Store_B") == col("B_ID")
    )
    .drop("A_ID", "B_ID")
)


# ============================================================
# 11. CALCULATE OVERLAP PERCENTAGE
# ============================================================

overlap_summary = overlap_summary.withColumn(
    "Overlap_Percentage",
    round(
        (
            col("Shared_Visitors")
            /
            (
                col("Visitors_A")
                + col("Visitors_B")
                - col("Shared_Visitors")
            )
        ) * 100,
        2
    )
)


# ============================================================
# 12. ORDER RESULTS
# ============================================================

overlap_summary = overlap_summary.orderBy(
    col("Shared_Visitors").desc()
)


# ============================================================
# 13. DISPLAY RESULTS
# ============================================================

print("\n======================================")
print("VISITOR OVERLAP BETWEEN STORES")
print("======================================")

overlap_summary.show(
    truncate=False
)


# ============================================================
# 14. SAVE OUTPUT
# ============================================================

output_path = "data/sample/visitor_overlap_sedona"

(
    overlap_summary
    .coalesce(1)
    .write
    .mode("overwrite")
    .option("header", True)
    .csv(output_path)
)


print("\nVisitor overlap output saved to:")
print(output_path)


# ============================================================
# 15. STOP SPARK
# ============================================================

spark.stop()


print("\n======================================")
print("GeoPulse Visitor Overlap completed.")
print("======================================")