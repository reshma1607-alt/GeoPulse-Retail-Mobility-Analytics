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