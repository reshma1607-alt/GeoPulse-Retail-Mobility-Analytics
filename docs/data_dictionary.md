# GeoPulse Data Dictionary

## GPS Mobility Data

The GPS mobility dataset represents anonymized mobile-device
locations recorded at different timestamps.

| Column | Data Type | Description |
|---|---|---|
| DeviceID | String | Anonymous identifier for a mobile device |
| Latitude | Float | Geographic latitude of the device |
| Longitude | Float | Geographic longitude of the device |
| Timestamp | DateTime | Date and time of the GPS observation |

## Store Data

The store dataset represents retail locations that will be used
for geospatial analysis.

| Column | Data Type | Description |
|---|---|---|
| StoreID | String | Unique identifier for a retail store |
| StoreName | String | Name assigned to the store |
| Latitude | Float | Geographic latitude of the store |
| Longitude | Float | Geographic longitude of the store |

## Derived Analytics

The following metrics will be calculated during the project:

### Footfall
Number of unique devices detected within a store's catchment area.

### Hourly Footfall
Number of unique devices visiting a store during each hour.

### Visitor Overlap
Number and percentage of devices that visit multiple stores.

### Cannibalization
Estimated overlap in visitor traffic between existing and
potential store locations.

### Catchment Area
A geographic area around a store used to identify nearby mobility
activity.

## GPS Data Generation

The GeoPulse project uses synthetic anonymized GPS mobility data for development and analysis.

The initial dataset contains:

- 1,000 anonymized devices
- 50 observations per device
- 50,000 total GPS observations
- Latitude and Longitude coordinates
- Timestamp for each observation
- Synthetic movement around the defined city area
- Increased movement around retail locations during morning and evening peak periods

The raw generated dataset is stored locally in `data/raw/` and is excluded from GitHub using `.gitignore`.

A smaller representative sample is stored in `data/sample/` for demonstration and testing.

## Analytics Outputs

The initial analytics pipeline produces:

1. GPS data validation
2. Overall mobility summary
3. Store-level footfall analysis
4. Hourly footfall analysis

These outputs will later support the geospatial processing, catchment analysis, cannibalization analysis, and dashboard stages of GeoPulse.