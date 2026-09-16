import pandas as pd


OVERLAP_PATH = "data/sample/visitor_overlap.csv"
OUTPUT_PATH = "data/sample/cannibalization_analysis.csv"


def calculate_cannibalization(overlap):
    """
    Calculate a simple cannibalization indicator
    from visitor overlap between store pairs.
    """

    results = []

    for _, row in overlap.iterrows():

        shared_visitors = row["SharedVisitors"]
        visitors_a = row["VisitorsStoreA"]
        visitors_b = row["VisitorsStoreB"]

        smaller_store_visitor_base = min(
            visitors_a,
            visitors_b
        )

        if smaller_store_visitor_base > 0:
            cannibalization_percentage = (
                shared_visitors
                / smaller_store_visitor_base
                * 100
            )
        else:
            cannibalization_percentage = 0

        if cannibalization_percentage >= 50:
            indicator = "High"

        elif cannibalization_percentage >= 25:
            indicator = "Medium"

        else:
            indicator = "Low"

        results.append(
            {
                "StoreA": row["StoreA"],
                "StoreB": row["StoreB"],
                "VisitorsStoreA": visitors_a,
                "VisitorsStoreB": visitors_b,
                "SharedVisitors": shared_visitors,
                "OverlapPercentage": row[
                    "OverlapPercentage"
                ],
                "CannibalizationPercentage": round(
                    cannibalization_percentage,
                    2
                ),
                "CannibalizationIndicator": indicator,
            }
        )

    return pd.DataFrame(results)


def main():

    print("=" * 60)
    print("GeoPulse - Cannibalization Analysis")
    print("=" * 60)

    overlap = pd.read_csv(OVERLAP_PATH)

    result = calculate_cannibalization(
        overlap
    )

    result.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nCANNIBALIZATION ANALYSIS")
    print("-" * 60)

    print(
        result.to_string(index=False)
    )

    print(
        f"\nOutput saved to: {OUTPUT_PATH}"
    )

    print(
        "\nCannibalization analysis completed successfully."
    )


if __name__ == "__main__":
    main()