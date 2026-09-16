import pandas as pd


INPUT_PATH = "data/sample/store_footfall_summary.csv"
OUTPUT_PATH = "data/sample/store_performance.csv"


def main():

    print("=" * 60)
    print("GeoPulse - Store Performance Comparison")
    print("=" * 60)

    df = pd.read_csv(INPUT_PATH)

    df["VisitorSharePercentage"] = (
        df["UniqueVisitors"]
        / df["UniqueVisitors"].sum()
        * 100
    )

    df["FootfallRank"] = (
        df["UniqueVisitors"]
        .rank(
            method="dense",
            ascending=False
        )
        .astype(int)
    )

    df = df.sort_values(
        "FootfallRank"
    )

    df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nSTORE PERFORMANCE")
    print("-" * 60)

    print(
        df[
            [
                "StoreID",
                "StoreName",
                "UniqueVisitors",
                "VisitorSharePercentage",
                "FootfallRank"
            ]
        ].to_string(index=False)
    )

    print(
        f"\nOutput saved to: {OUTPUT_PATH}"
    )

    print(
        "\nStore comparison completed."
    )


if __name__ == "__main__":
    main()