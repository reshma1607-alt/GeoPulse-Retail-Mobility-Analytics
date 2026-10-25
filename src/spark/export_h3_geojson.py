
import json
from pathlib import Path

import h3
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]

INPUT_FILE = ROOT / "data" / "sample" / "h3_mobility_summary.csv"
OUTPUT_FILE = ROOT / "dashboard" / "public" / "data" / "h3_mobility.geojson"

df = pd.read_csv(INPUT_FILE)
features = []

for _, row in df.iterrows():
    cell = row["H3_Cell"]
    boundary = h3.cell_to_boundary(cell)

    # GeoJSON uses longitude, latitude order.
    coordinates = [[lng, lat] for lat, lng in boundary]
    coordinates.append(coordinates[0])

    features.append({
        "type": "Feature",
        "properties": {
            "h3_cell": cell,
            "gps_observations": int(row["GPS_Observations"]),
            "unique_devices": int(row["Unique_Devices"]),
            "resolution": int(row["H3_Resolution"]),
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coordinates],
        },
    })

geojson = {
    "type": "FeatureCollection",
    "features": features,
}

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE.write_text(json.dumps(geojson), encoding="utf-8")

print(f"Exported {len(features)} H3 cells")
print(f"Saved to: {OUTPUT_FILE}")
