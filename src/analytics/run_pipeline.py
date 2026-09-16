import subprocess
import sys


SCRIPTS = [
    "src/validation/validate_gps.py",
    "src/analytics/mobility_summary.py",
    "src/analytics/store_footfall.py",
    "src/analytics/hourly_footfall.py",
    "src/analytics/device_visits.py",
    "src/analytics/visitor_overlap.py",
    "src/analytics/cannibalization.py",
    "src/analytics/peak_traffic.py",
    "src/analytics/store_comparison.py",
]


def run_script(script):
    print("\n" + "=" * 60)
    print(f"Running: {script}")
    print("=" * 60)

    result = subprocess.run(
        [sys.executable, script],
        capture_output=False
    )

    if result.returncode != 0:
        print(f"\nPipeline stopped because {script} failed.")
        sys.exit(result.returncode)

    print(f"Completed: {script}")


def main():
    print("\nGeoPulse Analytics Pipeline")
    print("=" * 60)

    for script in SCRIPTS:
        run_script(script)

    print("\n" + "=" * 60)
    print("GeoPulse analytics pipeline completed successfully.")
    print("=" * 60)


if __name__ == "__main__":
    main()