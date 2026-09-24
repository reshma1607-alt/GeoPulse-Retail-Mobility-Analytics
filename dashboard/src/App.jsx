import { useEffect, useState } from 'react'
import './App.css'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import GeoPulseMap from './GeoPulseMap'

function App() {
  const [stores, setStores] = useState([])
const [sedonaStores, setSedonaStores] = useState([])
const [hourlyData, setHourlyData] = useState([])
const [visitorOverlap, setVisitorOverlap] = useState([])
const [cannibalization, setCannibalization] = useState([])
const [searchTerm, setSearchTerm] = useState('')
const [minFootfall, setMinFootfall] = useState(0)
  useEffect(() => {
    fetch('/data/store_performance.csv')
      .then((response) => response.text())
      .then((text) => {
        const rows = text.trim().split('\n')
        const headers = rows[0]
          .split(',')
          .map((header) => header.trim())

        const data = rows.slice(1).map((row) => {
          const values = row
            .split(',')
            .map((value) => value.trim())

          return headers.reduce((object, header, index) => {
            object[header] = values[index]
            return object
          }, {})
        })

        setStores(data)
      })
      .catch((error) => {
        console.error('Error loading store data:', error)
      })
  }, [])
  useEffect(() => {
  fetch('/data/geopulse_sedona_summary.csv')
    .then((response) => response.text())
    .then((text) => {
      const rows = text.trim().split('\n')

      const headers = rows[0]
        .split(',')
        .map((header) => header.trim())

      const data = rows.slice(1).map((row) => {
        const values = row
          .split(',')
          .map((value) => value.trim())

        return headers.reduce((object, header, index) => {
          object[header] = values[index]
          return object
        }, {})
      })

      setSedonaStores(data)
    })
    .catch((error) => {
      console.error('Error loading Sedona data:', error)
    })
}, [])
 useEffect(() => {
  fetch('/data/hourly_footfall.csv')
    .then((response) => response.text())
    .then((text) => {
      const rows = text.trim().split('\n')

      const headers = rows[0]
        .split(',')
        .map((header) => header.trim())

      const data = rows.slice(1).map((row) => {
        const values = row
          .split(',')
          .map((value) => value.trim())

        return headers.reduce((object, header, index) => {
          object[header] = values[index]
          return object
        }, {})
      })

      setHourlyData(data)
    })
    .catch((error) => {
      console.error('Error loading hourly data:', error)
    })
}, [])
  // Load Visitor Overlap Data
  useEffect(() => {
    fetch('/data/visitor_overlap.csv')
      .then((response) => response.text())
      .then((text) => {
        const rows = text.trim().split('\n')
        const headers = rows[0].split(',').map((header) => header.trim())

        const data = rows.slice(1).map((row) => {
          const values = row.split(',').map((value) => value.trim())

          return headers.reduce((object, header, index) => {
            object[header] = values[index]
            return object
          }, {})
        })

        setVisitorOverlap(data)
      })
      .catch((error) => {
        console.error('Error loading visitor overlap data:', error)
      })
  }, [])

  // Load Cannibalization Data
  useEffect(() => {
    fetch('/data/cannibalization_analysis.csv')
      .then((response) => response.text())
      .then((text) => {
        const rows = text.trim().split('\n')
        const headers = rows[0].split(',').map((header) => header.trim())

        const data = rows.slice(1).map((row) => {
          const values = row.split(',').map((value) => value.trim())

          return headers.reduce((object, header, index) => {
            object[header] = values[index]
            return object
          }, {})
        })

        setCannibalization(data)
      })
      .catch((error) => {
        console.error('Error loading cannibalization data:', error)
      })
  }, [])
    const totalPairs = visitorOverlap.length

  const averageOverlap =
    visitorOverlap.length > 0
      ? (
          visitorOverlap.reduce(
            (sum, item) => sum + Number(item.OverlapPercentage),
            0
          ) / visitorOverlap.length
        ).toFixed(2)
      : '0'

  const highCannibalization = cannibalization.filter(
    (item) => item.CannibalizationIndicator === 'High'
  ).length
    const filteredStores = stores.filter(
  (store) =>
    store.StoreName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    Number(store.GPSObservations || 0) >= minFootfall
)

  return (
    <div className="app">

      <header className="header">
        <div>
          <h1>GeoPulse</h1>
          <p>Hyper-Local Retail Mobility Analytics</p>
        </div>

        <div className="header-badge">
          Retail Intelligence
        </div>
      </header>

      <main className="dashboard">

        <section className="welcome">
  <div className="welcome-content">
    <div>
      <span className="dashboard-label">
        GEOSPATIAL RETAIL ANALYTICS
      </span>

      <h2>Retail Mobility Dashboard</h2>

      <p>
        Transform anonymized mobility data into actionable retail
        intelligence through footfall, catchment, distance, and
        visitor behavior analysis.
      </p>
    </div>

    <div className="dashboard-status">
      <span className="status-dot"></span>
      Analytics Pipeline Active
    </div>
  </div>
</section>
<section className="panel map-panel">
  <h3>GeoPulse Store Intelligence Map</h3>

  <p>
    Interactive geospatial view of retail stores with a
    500-meter catchment radius.
  </p>

  <GeoPulseMap />
</section>

        {/* KPI CARDS */}
        <section className="kpi-grid">

          <div className="kpi-card">
            <span>Total Stores</span>
            <strong>{stores.length}</strong>
          </div>

          <div className="kpi-card">
            <span>GPS Observations</span>
            <strong>50,000</strong>
          </div>

          <div className="kpi-card">
            <span>Unique Devices</span>
            <strong>1,000</strong>
          </div>

          <div className="kpi-card">
            <span>500m Catchment</span>
            <strong>42,164</strong>
          </div>
          <div className="kpi-card">
  <span>Store Pairs Analyzed</span>
  <strong>{totalPairs}</strong>
</div>

<div className="kpi-card">
  <span>Average Visitor Overlap</span>
  <strong>{averageOverlap}%</strong>
</div>

<div className="kpi-card">
  <span>High Cannibalization Pairs</span>
  <strong>{highCannibalization}</strong>
</div>

        </section>
        <div className="search-panel">
  <label htmlFor="store-search">Search Store</label>

  <input
    id="store-search"
    type="text"
    placeholder="Search by store name..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />
</div>
<div className="search-panel">
  <label htmlFor="min-footfall">Minimum Footfall</label>

  <input
    id="min-footfall"
    type="number"
    min="0"
    placeholder="Enter minimum footfall"
    value={minFootfall}
    onChange={(event) => setMinFootfall(Number(event.target.value))}
  />
</div>
<button
  onClick={() => {
    setSearchTerm('')
    setMinFootfall(0)
  }}
>
  Reset Filters
</button>

        {/* STORE PERFORMANCE */}
        <section className="panel">
          <h3>Store Performance</h3>

          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>GPS Observations</th>
                <th>Unique Visitors</th>
                <th>Visitor Share</th>
                <th>Rank</th>
              </tr>
            </thead>

            <tbody>
              {filteredStores.map((store) => (
                <tr key={store.StoreID}>
                  <td>{store.StoreName}</td>

                  <td>
                    {Number(
                      store.GPSObservations
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      store.UniqueVisitors
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      store.VisitorSharePercentage
                    ).toFixed(2)}%
                  </td>

                  <td>
                    #{Number(store.FootfallRank)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel">
  <h3>Store Footfall Comparison</h3>

  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={filteredStores}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="StoreName" />
      <YAxis />
      <Tooltip
  formatter={(value) => [`${value}%`, 'Visitor Overlap']}
/>
      <Bar dataKey="GPSObservations" fill="#4f46e5" />
    </BarChart>
  </ResponsiveContainer>
</section>

        {/* SEDONA DISTANCE ANALYSIS */}
<section className="panel">
  <h3>Store Catchment & Distance Analysis</h3>

  <table>
    <thead>
      <tr>
        <th>Store</th>
        <th>Avg Distance</th>
        <th>Min Distance</th>
        <th>Max Distance</th>
        <th>Within 250m</th>
      </tr>
    </thead>

    <tbody>
      {sedonaStores.map((store) => (
        <tr key={store.StoreID}>
          <td>{store.StoreName}</td>

          <td>
            {Number(
              store.Average_Distance_Meters
            ).toFixed(2)} m
          </td>

          <td>
            {Number(
              store.Minimum_Distance_Meters
            ).toFixed(2)} m
          </td>

          <td>
            {Number(
              store.Maximum_Distance_Meters
            ).toFixed(2)} m
          </td>

          <td>
            {Number(
              store.Percent_Within_250m
            ).toFixed(2)}%
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
{/* HOURLY FOOTFALL */}
<section className="panel">
  <h3>Hourly Footfall Trend</h3>

  <p>
    GPS observations and unique visitors across recorded hours.
  </p>

  <div className="hourly-chart">
    {hourlyData.slice(0, 24).map((item, index) => (
      <div className="hour-bar" key={`${item.Date}-${item.Hour}-${index}`}>
        <div
          className="hour-bar-fill"
          style={{
            height: `${Math.max(
              Number(item.UniqueVisitors) * 2,
              10
            )}px`
          }}
          title={`${item.UniqueVisitors} visitors`}
        ></div>

        <span>{item.Hour}</span>
      </div>
    ))}
  </div>
</section>
{/* VISITOR OVERLAP ANALYSIS */}
<section className="panel">
  <h3>Visitor Overlap Analysis</h3>

  <p>
    Shared visitors between different retail stores.
  </p>

  <table>
    <thead>
      <tr>
        <th>Store A</th>
        <th>Store B</th>
        <th>Shared Visitors</th>
        <th>Overlap</th>
      </tr>
    </thead>

    <tbody>
      {visitorOverlap.map((item, index) => (
        <tr key={`${item.StoreA}-${item.StoreB}-${index}`}>
          <td>{item.StoreA}</td>
          <td>{item.StoreB}</td>
          <td>
            {Number(item.SharedVisitors).toLocaleString()}
          </td>
          <td>{Number(item.OverlapPercentage).toFixed(2)}%</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>
<section className="panel">
  <h3>Visitor Overlap Comparison</h3>

<p>
  Compare shared visitor percentages across retail store pairs.
</p>

  <ResponsiveContainer width="100%" height={350}>
    <BarChart data={visitorOverlap}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
  dataKey="StoreBName"
  angle={-35}
  textAnchor="end"
  height={80}
/>
      <YAxis />
      <Tooltip />
      <Bar dataKey="OverlapPercentage" fill="#14b8a6" />
    </BarChart>
  </ResponsiveContainer>
</section>

{/* CANNIBALIZATION ANALYSIS */}
<section className="panel">
  <h3>Cannibalization Analysis</h3>

  <p>
    Store pairs with overlapping visitors and cannibalization indicators.
  </p>

  <table>
    <thead>
      <tr>
        <th>Store A</th>
        <th>Store B</th>
        <th>Shared Visitors</th>
        <th>Cannibalization</th>
        <th>Indicator</th>
      </tr>
    </thead>

    <tbody>
      {cannibalization.map((item, index) => (
        <tr key={`${item.StoreA}-${item.StoreB}-${index}`}>
          <td>{item.StoreA}</td>
          <td>{item.StoreB}</td>
          <td>
            {Number(item.SharedVisitors).toLocaleString()}
          </td>
          <td>
            {Number(item.CannibalizationPercentage).toFixed(2)}%
          </td>
          <td>{item.CannibalizationIndicator}</td>
        </tr>
      ))}
    </tbody>
  </table>
</section>

        {/* ANALYTICS GRID */}
        <section className="content-grid">

          {/* FOOTFALL CHART */}
          <div className="panel">
            <h3>Footfall Comparison</h3>

            <div className="chart">

              {stores.map((store) => (
                <div
                  className="chart-row"
                  key={store.StoreID}
                >

                  <div className="chart-label">
                    {store.StoreName}
                  </div>

                  <div className="bar-container">

                    <div
                      className="bar"
                      style={{
                        width: `${
                          (Number(store.UniqueVisitors) / 1000) * 100
                        }%`
                      }}
                    >
                      {Number(
                        store.UniqueVisitors
                      ).toLocaleString()}
                    </div>

                  </div>

                </div>
              ))}

            </div>
          </div>

          {/* SPATIAL ANALYTICS */}
          <div className="panel">
            <h3>Spatial Analytics</h3>

            <p>
              Explore store catchment distance, visitor overlap,
              and cannibalization indicators.
            </p>

            <div className="analytics-item">
  <span>Catchment Radius</span>
  <strong>500 m</strong>
</div>

<div className="analytics-item">
  <span>Avg. Distance</span>
  <strong>
    {sedonaStores.length > 0
      ? (
          sedonaStores.reduce(
            (sum, store) =>
              sum + Number(store.Average_Distance_Meters),
            0
          ) / sedonaStores.length
        ).toFixed(2)
      : '0'} m
  </strong>
</div>

<div className="analytics-item">
  <span>Stores Analyzed</span>
  <strong>{sedonaStores.length}</strong>
</div>

<div className="analytics-item">
  <span>250m Catchment Avg.</span>
  <strong>
    {sedonaStores.length > 0
      ? (
          sedonaStores.reduce(
            (sum, store) =>
              sum + Number(store.Percent_Within_250m),
            0
          ) / sedonaStores.length
        ).toFixed(2)
      : '0'}%
  </strong>
</div>
          </div>

          {/* MOBILITY INTELLIGENCE */}
          <div className="panel">
            <h3>Mobility Intelligence</h3>

            <p>
              Use GPS mobility patterns to understand retail
              traffic and visitor behavior.
            </p>

            <div className="analytics-item">
              <span>GPS Records</span>
              <strong>50,000</strong>
            </div>

            <div className="analytics-item">
              <span>Unique Devices</span>
              <strong>1,000</strong>
            </div>

            <div className="analytics-item">
              <span>Spatial Radius</span>
              <strong>500 m</strong>
            </div>

          </div>

        </section>

      </main>

    </div>
  )
}

export default App