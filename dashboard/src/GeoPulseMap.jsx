import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip,
} from 'react-leaflet'
import L from 'leaflet'

const storeIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
function MapLegend() {
  return (
    <div className="map-legend">
      <div className="legend-title">Map Legend</div>

      <div className="legend-item">
        <span className="legend-marker"></span>
        <span>Retail Store</span>
      </div>

      <div className="legend-item">
        <span className="legend-circle"></span>
        <span>500m Catchment</span>
      </div>
    </div>
  )
}
function GeoPulseMap() {

  const [stores, setStores] = useState([])
  const [performance, setPerformance] = useState([])
  useEffect(() => {
  Promise.all([
    fetch('/data/stores.csv').then((response) => response.text()),
    fetch('/data/store_performance.csv').then((response) => response.text()),
  ])
    .then(([storeText, performanceText]) => {
      const parseCSV = (text) => {
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map((header) => header.trim())

        return lines.slice(1).map((line) => {
          const values = line.split(',').map((value) => value.trim())

          return headers.reduce((object, header, index) => {
            object[header] = values[index]
            return object
          }, {})
        })
      }

      setStores(parseCSV(storeText))
      setPerformance(parseCSV(performanceText))
    })
    .catch((error) => {
      console.error('Error loading GeoPulse data:', error)
    })
}, []) 
  return (
    <div className="geopulse-map">
      <MapContainer
        center={[16.306, 80.436]}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {stores.map((store) => {
          const latitude = Number(store.Latitude)
          const longitude = Number(store.Longitude)

          return (
            <div key={store.StoreID}>
              <Marker
  position={[latitude, longitude]}
  icon={storeIcon}
>
  <Tooltip direction="top" offset={[0, -35]}>
    <strong>{store.StoreName}</strong>
  </Tooltip>

 <Popup>
  {(() => {
    const storePerformance = performance.find(
      (item) => item.StoreID === store.StoreID
    )

    return (
      <div className="store-popup">
        <h4>{store.StoreName}</h4>

        <div className="popup-divider"></div>

        <p>
          <strong>Store ID:</strong>{' '}
          {store.StoreID}
        </p>

        <p>
          <strong>GPS Observations:</strong>{' '}
          {storePerformance?.GPSObservations ?? 'N/A'}
        </p>

        <p>
          <strong>Unique Visitors:</strong>{' '}
          {storePerformance?.UniqueVisitors ?? 'N/A'}
        </p>

        <p>
          <strong>Visitor Share:</strong>{' '}
          {storePerformance
            ? `${Number(
                storePerformance.VisitorSharePercentage
              ).toFixed(2)}%`
            : 'N/A'}
        </p>

        <p>
          <strong>Footfall Rank:</strong>{' '}
          {storePerformance
            ? `#${storePerformance.FootfallRank}`
            : 'N/A'}
        </p>

        <p>
          <strong>Catchment Radius:</strong>{' '}
          500 m
        </p>

        <div className="popup-status">
          <span>●</span> Active Retail Location
        </div>
      </div>
    )
  })()}
</Popup>
</Marker>

              <Circle
                center={[latitude, longitude]}
                radius={500}
                pathOptions={{
                  fillOpacity: 0.08,
                  weight: 1,
                }}
              />
            </div>
          )
        })}
        <MapLegend />
      </MapContainer>
    </div>
  )
}

export default GeoPulseMap