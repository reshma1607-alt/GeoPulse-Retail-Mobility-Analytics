import subprocess
import sys


SCRIPTS = [
    "src/validation/validate_gps.py",
    "src/validation/validate_sedona.py",
    "src/analytics/mobility_summary.py",
    "src/analytics/store_footfall.py",
    "src/analytics/hourly_footfall.py",
    "src/analytics/device_visits.py",
    "src/analytics/visitor_overlap.py",
    "src/analytics/cannibalization.py",
    "src/analytics/peak_traffic.py",
    "src/analytics/store_comparison.py",
    "src/spark/spatial_join.py",
    "src/spark/distance_analysis.py",
    "src/spark/catchment_analysis.py",
    "src/spark/visitor_overlap_analysis.py",
    "src/spark/cannibalization_analysis.py",
]


print("\n======================================")
print("GeoPulse Analytics Pipeline")
print("======================================")

print(f"\nTotal pipeline steps: {len(SCRIPTS)}")


for index, script in enumerate(SCRIPTS, start=1):

    print("\n--------------------------------------")
    print(f"Step {index}/{len(SCRIPTS)}")
    print(f"Running: {script}")
    print("--------------------------------------")

    result = subprocess.run(
        [sys.executable, script],
        check=False
    )

    if result.returncode != 0:
        print(f"\nERROR: Pipeline failed at {script}")
        sys.exit(result.returncode)

    print(f"\nCompleted: {script}")


print("\n======================================")
print("GeoPulse Analytics Pipeline completed.")
print("All analysis steps executed successfully.")
print("======================================")