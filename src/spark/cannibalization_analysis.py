from pyspark.sql import SparkSession
from pyspark.sql.functions import col, round, when
from sedona.spark import SedonaContext


# ============================================================
# 1. START SPARK + SEDONA
# ============================================================

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("GeoPulse-Cannibalization-Analysis")
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
print("GeoPulse Cannibalization Analysis")
print("======================================")


# ============================================================
# 2. LOAD VISITOR OVERLAP DATA
# ============================================================

overlap_df = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("data/sample/visitor_overlap_sedona")
)


print("\nVisitor overlap records:", overlap_df.count())


# ============================================================
# 3. DISPLAY INPUT DATA
# ============================================================

print("\n======================================")
print("VISITOR OVERLAP INPUT")
print("======================================")

overlap_df.show(truncate=False)


# ============================================================
# 4. CALCULATE CANNIBALIZATION INDICATOR
#
# Formula:
#
# Shared Visitors / Smaller Store Visitor Base * 100
#
# This measures the proportion of the smaller store's
# visitor base that is shared with the other store.
# ============================================================

cannibalization_df = overlap_df.withColumn(
    "Smaller_Store_Visitors",
    when(
        col("Visitors_A") < col("Visitors_B"),
        col("Visitors_A")
    ).otherwise(
        col("Visitors_B")
    )
)


cannibalization_df = cannibalization_df.withColumn(
    "Cannibalization_Indicator",
    round(
        (
            col("Shared_Visitors")
            /
            col("Smaller_Store_Visitors")
        ) * 100,
        2
    )
)


# ============================================================
# 5. ASSIGN INDICATOR CATEGORY
# ============================================================

cannibalization_df = cannibalization_df.withColumn(
    "Indicator_Category",
    when(
        col("Cannibalization_Indicator") < 25,
        "Low"
    )
    .when(
        col("Cannibalization_Indicator") < 50,
        "Medium"
    )
    .otherwise(
        "High"
    )
)


# ============================================================
# 6. SELECT FINAL COLUMNS
# ============================================================

cannibalization_df = cannibalization_df.select(
    "Store_A",
    "Store_A_Name",
    "Store_B",
    "Store_B_Name",
    "Visitors_A",
    "Visitors_B",
    "Shared_Visitors",
    "Cannibalization_Indicator",
    "Indicator_Category"
)


# ============================================================
# 7. ORDER RESULTS
# ============================================================

cannibalization_df = cannibalization_df.orderBy(
    col("Cannibalization_Indicator").desc()
)


# ============================================================
# 8. DISPLAY RESULTS
# ============================================================

print("\n======================================")
print("CANNIBALIZATION INDICATOR")
print("======================================")

cannibalization_df.show(
    truncate=False
)


# ============================================================
# 9. SAVE OUTPUT
# ============================================================

output_path = "data/sample/cannibalization_sedona"

(
    cannibalization_df
    .coalesce(1)
    .write
    .mode("overwrite")
    .option("header", True)
    .csv(output_path)
)


print("\nCannibalization analysis output saved to:")
print(output_path)


# ============================================================
# 10. STOP SPARK
# ============================================================

spark.stop()


print("\n======================================")
print("GeoPulse Cannibalization Analysis completed.")
print("======================================")