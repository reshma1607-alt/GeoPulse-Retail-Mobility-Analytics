import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Tooltip,
  Polygon,
} from 'react-leaflet'

import L from 'leaflet'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ReferenceLine,
} from 'recharts'


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

      <div className="legend-title" style={{ marginTop: '12px' }}>
        Mobility Intensity
      </div>

      {[
        { color: '#7c3aed', label: 'Very High', range: '7,000+' },
        { color: '#4f46e5', label: 'High', range: '3,000–6,999' },
        { color: '#0891b2', label: 'Medium', range: '1,000–2,999' },
        { color: '#22d3ee', label: 'Low', range: 'Below 1,000' },
      ].map((item) => (
        <div className="legend-item" key={item.label}>
          <span
            style={{
              background: item.color,
              width: '14px',
              height: '14px',
              display: 'inline-block',
              borderRadius: '3px',
              flexShrink: 0,
            }}
          />
          <span>
            {item.label} ({item.range} observations)
          </span>
        </div>
      ))}
    </div>
  )
}



function getH3Color(observations) {
  const value = Number(observations)

  if (value >= 7000) return '#7c3aed'
  if (value >= 3000) return '#4f46e5'
  if (value >= 1000) return '#0891b2'
  return '#22d3ee'
}

function GeoPulseMap() {

  const [stores, setStores] = useState([])
  const [performance, setPerformance] = useState([])
  const [h3Cells, setH3Cells] = useState([])
  const [h3GeoJson, setH3GeoJson] = useState(null)
  const [hourlyData, setHourlyData] = useState([])
  const [selectedHour, setSelectedHour] = useState(12)

const hourlyCells = hourlyData.filter(
  (cell) => Number(cell.Hour) === selectedHour
)

const hourlyCellMap = new Map(
  hourlyCells.map((cell) => [cell.H3_Cell, cell])
)

const hourlyTrend = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: `${String(hour).padStart(2, '0')}:00`,
  observations: hourlyData
    .filter((cell) => Number(cell.Hour) === hour)
    .reduce(
      (total, cell) => total + Number(cell.GPS_Observations || 0),
      0
    ),
}))


const hourlyObservations = hourlyCells.reduce(
  (total, cell) => total + Number(cell.GPS_Observations || 0),
  0
)

const hourlyUniqueDevices = new Set(
  hourlyCells.flatMap((cell) => {
    // The CSV contains aggregate counts, not device IDs.
    return []
  })
).size

const activeH3Cells = hourlyCells.length

const busiestCell = hourlyCells.reduce(
  (busiest, cell) =>
    !busiest ||
    Number(cell.GPS_Observations) > Number(busiest.GPS_Observations)
      ? cell
      : busiest,
  null
)

const hourlyDevicesTotal = hourlyCells.reduce(
  (total, cell) => total + Number(cell.Unique_Devices || 0),
  0
)

useEffect(() => {
  const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map((header) => header.trim())

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((value) => value.trim())

      return headers.reduce((object, header, index) => {
        object[header] = values[index]
        return object
      }, {})
    })
  }
  fetch('/data/h3_mobility.geojson')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to load H3 GeoJSON')
    }
    return response.json()
  })
  .then((data) => setH3GeoJson(data))
  .catch((error) => {
    console.error('Error loading H3 hexagons:', error)
  })
  fetch('/data/h3_hourly_mobility.csv')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to load hourly H3 data')
    }
    return response.text()
  })
  .then((text) => {
    const lines = text.trim().split(/\r?\n/)
    const headers = lines[0].split(',').map((header) => header.trim())

    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((value) => value.trim())

      return headers.reduce((object, header, index) => {
        object[header] = values[index]
        return object
      }, {})
    })

    setHourlyData(rows)
  })
  .catch((error) => {
    console.error('Error loading hourly H3 data:', error)
  })

  Promise.all([
    fetch('/data/stores.csv').then((response) => {
      if (!response.ok) throw new Error('Failed to load stores')
      return response.text()
    }),
    fetch('/data/store_performance.csv').then((response) => {
      if (!response.ok) throw new Error('Failed to load store performance')
      return response.text()
    }),
    fetch('/data/h3_mobility_summary.csv').then((response) => {
      if (!response.ok) throw new Error('Failed to load H3 data')
      return response.text()
    }),
  ])
    .then(([storeText, performanceText, h3Text]) => {
      setStores(parseCSV(storeText))
      setPerformance(parseCSV(performanceText))
      setH3Cells(parseCSV(h3Text))
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
 
{h3GeoJson?.features.map((feature) => {
  const cellId = feature.properties.h3_cell
  const hourlyCell = hourlyCellMap.get(cellId)

  // Hide cells with no GPS observations during the selected hour.
  if (!hourlyCell) return null

  const coordinates = feature.geometry.coordinates[0].map(
    ([longitude, latitude]) => [latitude, longitude]
  )

  const observations = Number(hourlyCell.GPS_Observations)

  return (
    <Polygon
      key={cellId}
      positions={coordinates}
      pathOptions={{
        color: getH3Color(observations),
        fillColor: getH3Color(observations),
        fillOpacity: 0.4,
        weight: 1,
      }}
    >
      <Popup>
        <div>
          <strong>H3 Mobility Cell</strong>
          <p>Cell ID: {cellId}</p>
          <p>Selected Hour: {String(selectedHour).padStart(2, '0')}:00</p>
          <p>GPS Observations: {observations.toLocaleString()}</p>
          <p>
            Unique Devices:{' '}
            {Number(hourlyCell.Unique_Devices).toLocaleString()}
          </p>
          <p>Resolution: {hourlyCell.H3_Resolution}</p>
        </div>
      </Popup>
    </Polygon>
  )
})}



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

<div
  style={{
    position: 'absolute',
    zIndex: 1000,
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#111827',
    color: 'white',
    padding: '12px 18px',
    borderRadius: '12px',
    width: 'min(360px, 85%)',
    boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
  }}
>
  <label
    htmlFor="mobility-hour"
    style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}
  >
    Mobility Hour: {String(selectedHour).padStart(2, '0')}:00
  </label>

  <input
    id="mobility-hour"
    type="range"
    min="0"
    max="23"
    step="1"
    value={selectedHour}
    onChange={(event) => setSelectedHour(Number(event.target.value))}
    style={{ width: '100%', cursor: 'pointer' }}
  />

  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
    <span>00:00</span>
    <span>12:00</span>
    <span>23:00</span>
  </div>
</div>

<div
  style={{
    position: 'absolute',
    zIndex: 1000,
    top: '12px',
    left: '12px',
    background: '#111827',
    color: 'white',
    padding: '8px 10px',
borderRadius: '10px',
width: '155px',
minWidth: '155px',
maxWidth: '155px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
    fontSize: '13px',
  }}
>
  <strong style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
  Hourly Mobility — {String(selectedHour).padStart(2, '0')}:00
</strong>

  <div style={{ marginTop: '8px' }}>
    <div style={{ color: '#9ca3af' }}>GPS Observations</div>
    <div style={{ fontSize: '18px', fontWeight: 700 }}>
      {hourlyObservations.toLocaleString()}
    </div>
  </div>

  <div style={{ marginTop: '6px' }}>
    <div style={{ color: '#9ca3af' }}>Active H3 Cells</div>
    <div style={{ fontSize: '18px', fontWeight: 700 }}>
      {activeH3Cells}
    </div>
  </div>

  <div style={{ marginTop: '6px' }}>
    <div style={{ color: '#9ca3af' }}>Busiest H3 Cell</div>
    <div style={{ fontWeight: 600 }}>
      {busiestCell
        ? busiestCell.H3_Cell
        : 'No activity'}
    </div>
    <div>
      {busiestCell
        ? `${Number(busiestCell.GPS_Observations).toLocaleString()} observations`
        : ''}
    </div>
  </div>
</div>

        <MapLegend />
      </MapContainer>

      {/* 24-Hour Mobility Activity Chart */}
      <div
        style={{
          marginTop: '18px',
          padding: '18px',
          background: '#111827',
          border: '1px solid #263247',
          borderRadius: '14px',
          color: '#ffffff',
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            24-Hour Mobility Activity
          </h3>
          <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '12px' }}>
            GPS observations across the day
          </p>
        </div>

        <div style={{ width: '100%', height: '260px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={hourlyTrend}
              margin={{ top: 10, right: 12, left: 0, bottom: 5 }}
            >
              <CartesianGrid stroke="#263247" strokeDasharray="3 3" />

              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                interval={3}
              />

              <YAxis
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                width={48}
              />

              <ChartTooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#ffffff',
                }}
                labelStyle={{ color: '#ffffff' }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  'GPS Observations',
                ]}
              />

              <ReferenceLine
                x={`${String(selectedHour).padStart(2, '0')}:00`}
                stroke="#a78bfa"
                strokeDasharray="4 4"
                label={{
                  value: 'Selected hour',
                  fill: '#c4b5fd',
                  fontSize: 10,
                }}
              />

              <Line
                type="monotone"
                dataKey="observations"
                name="GPS Observations"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#22d3ee' }}
                activeDot={{ r: 6, fill: '#a78bfa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default GeoPulseMap