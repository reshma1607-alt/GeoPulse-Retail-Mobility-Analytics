from pyspark.sql import SparkSession
from sedona.spark import SedonaContext

spark = (
    SparkSession.builder
    .master("local[*]")
    .appName("GeoPulse-Sedona-Test")
    .config(
        "spark.jars.packages",
        "org.apache.sedona:sedona-spark-shaded-4.1_2.13:1.9.1,"
        "org.datasyslab:geotools-wrapper:1.9.1-33.5"
    )
    .config("spark.hadoop.fs.file.impl", "org.apache.hadoop.fs.LocalFileSystem")
    .config("spark.hadoop.fs.permissions.umask-mode", "022")
    .getOrCreate()
)

sedona = SedonaContext.create(spark)

print("===================================")
print("PySpark started successfully.")
print("Apache Sedona initialized successfully.")
print("Spark version:", spark.version)
print("===================================")

sedona.sql("""
    SELECT ST_AsText(ST_Point(80.0, 16.0)) AS location
""").show(truncate=False)

sedona.stop()