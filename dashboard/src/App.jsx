
import { useEffect, useState } from 'react'
import './App.css'
import GeoPulseMap from './GeoPulseMap'

// Reusable CSV loader
const loadCSV = async (filePath) => {
  const response = await fetch(filePath)

  if (!response.ok) {
    throw new Error(`Failed to load ${filePath}`)
  }

  const text = await response.text()
  const rows = text.trim().split('\n')

  if (rows.length === 0) {
    return []
  }

  const headers = rows[0]
    .split(',')
    .map((header) => header.trim())

  return rows.slice(1).map((row) => {
    const values = row
      .split(',')
      .map((value) => value.trim())

    return headers.reduce((object, header, index) => {
      object[header] = values[index] || ''
      return object
    }, {})
  })
}

function App() {
  const [stores, setStores] = useState([])
  const [sedonaStores, setSedonaStores] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [visitorOverlap, setVisitorOverlap] = useState([])
  const [cannibalization, setCannibalization] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [minFootfall, setMinFootfall] = useState(0)

  // Load all dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [
          storeData,
          sedonaData,
          hourlyFootfallData,
          overlapData,
          cannibalizationData
        ] = await Promise.all([
          loadCSV('/data/store_performance.csv'),
          loadCSV('/data/geopulse_sedona_summary.csv'),
          loadCSV('/data/hourly_footfall.csv'),
          loadCSV('/data/visitor_overlap.csv'),
          loadCSV('/data/cannibalization_analysis.csv')
        ])

        setStores(storeData)
        setSedonaStores(sedonaData)
        setHourlyData(hourlyFootfallData)
        setVisitorOverlap(overlapData)
        setCannibalization(cannibalizationData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      }
    }

    loadDashboardData()
  }, [])

  // Summary calculations
  const totalPairs = visitorOverlap.length

  const averageOverlap =
    visitorOverlap.length > 0
      ? (
          visitorOverlap.reduce(
            (sum, item) =>
              sum + (Number(item.OverlapPercentage) || 0),
            0
          ) / visitorOverlap.length
        ).toFixed(2)
      : '0.00'

  const highCannibalization = cannibalization.filter(
    (item) =>
      item.CannibalizationIndicator?.toLowerCase() === 'high'
  ).length

  // Filter stores
  const filteredStores = stores.filter((store) => {
    const storeName = String(store.StoreName || '').toLowerCase()
    const searchValue = searchTerm.toLowerCase()

    const matchesSearch = storeName.includes(searchValue)

    const matchesFootfall =
      Number(store.GPSObservations || 0) >= minFootfall

    return matchesSearch && matchesFootfall
  })

  // Maximum footfall for comparison bars
  const maxFootfall = Math.max(
    ...filteredStores.map(
      (store) => Number(store.GPSObservations) || 0
    ),
    1
  )

  // Maximum visitor overlap for comparison bars
  const maxOverlap = Math.max(
    ...visitorOverlap.map(
      (item) => Number(item.OverlapPercentage) || 0
    ),
    1
  )

  // Average distance
  const averageDistance =
    sedonaStores.length > 0
      ? (
          sedonaStores.reduce(
            (sum, store) =>
              sum + (Number(store.Average_Distance_Meters) || 0),
            0
          ) / sedonaStores.length
        ).toFixed(2)
      : '0.00'

  // Average visitors within 250 meters
  const averageWithin250m =
    sedonaStores.length > 0
      ? (
          sedonaStores.reduce(
            (sum, store) =>
              sum + (Number(store.Percent_Within_250m) || 0),
            0
          ) / sedonaStores.length
        ).toFixed(2)
      : '0.00'

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setMinFootfall(0)
  }

  return (
    <div className="app">

      {/* HEADER */}
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

        {/* WELCOME SECTION */}
        <section className="welcome">
          <div className="welcome-content">

            <div>
              <span className="dashboard-label">
                GEOSPATIAL RETAIL ANALYTICS
              </span>

              <h2>Retail Mobility Dashboard</h2>

              <p>
                Transform anonymized mobility data into actionable
                retail intelligence through footfall, catchment,
                distance, and visitor behavior analysis.
              </p>
            </div>

            <div className="dashboard-status">
              <span className="status-dot"></span>
              Analytics Pipeline Active
            </div>

          </div>
        </section>

        {/* STORE MAP */}
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

        {/* FILTERS */}
        <section className="filters-container">

          <div className="search-panel">
            <label htmlFor="store-search">
              Search Store
            </label>

            <input
              id="store-search"
              type="text"
              placeholder="Search by store name..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="search-panel">
            <label htmlFor="min-footfall">
              Minimum Footfall
            </label>

            <input
              id="min-footfall"
              type="number"
              min="0"
              placeholder="Enter minimum footfall"
              value={minFootfall}
              onChange={(event) =>
                setMinFootfall(Number(event.target.value))
              }
            />
          </div>

          <button onClick={resetFilters}>
            Reset Filters
          </button>

        </section>

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
                      store.GPSObservations || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      store.UniqueVisitors || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      store.VisitorSharePercentage || 0
                    ).toFixed(2)}%
                  </td>

                  <td>
                    #{Number(store.FootfallRank || 0)}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* STORE FOOTFALL COMPARISON */}
        <section className="panel footfall-comparison-panel">

          <h3>Store Footfall Comparison</h3>

          <p>
            Compare GPS observations across all retail stores.
          </p>

          <div className="comparison-chart">

            {filteredStores.map((store) => {
              const footfall =
                Number(store.GPSObservations) || 0

              const barWidth =
                (footfall / maxFootfall) * 100

              return (
                <div
                  className="comparison-row"
                  key={store.StoreID}
                >

                  <div className="comparison-header">
                    <span>{store.StoreName}</span>

                    <strong>
                      {footfall.toLocaleString()}
                    </strong>
                  </div>

                  <div className="comparison-track">
                    <div
                      className="comparison-fill"
                      style={{
                        width: `${barWidth}%`
                      }}
                    ></div>
                  </div>

                </div>
              )
            })}

          </div>
        </section>

        {/* CATCHMENT AND DISTANCE ANALYSIS */}
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
                      store.Average_Distance_Meters || 0
                    ).toFixed(2)} m
                  </td>

                  <td>
                    {Number(
                      store.Minimum_Distance_Meters || 0
                    ).toFixed(2)} m
                  </td>

                  <td>
                    {Number(
                      store.Maximum_Distance_Meters || 0
                    ).toFixed(2)} m
                  </td>

                  <td>
                    {Number(
                      store.Percent_Within_250m || 0
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
            GPS observations and unique visitors across recorded
            hours.
          </p>

          <div className="hourly-chart">

            {hourlyData
              .slice(0, 24)
              .map((item, index) => {

                const visitors =
                  Number(item.UniqueVisitors) || 0

                return (
                  <div
                    className="hour-bar"
                    key={`${item.Date}-${item.Hour}-${index}`}
                  >

                    <div
                      className="hour-bar-fill"
                      style={{
                        height: `${Math.max(
                          visitors * 2,
                          10
                        )}px`
                      }}
                      title={`${visitors} visitors`}
                    ></div>

                    <span>{item.Hour}</span>

                  </div>
                )
              })}

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
                <tr
                  key={`${item.StoreA}-${item.StoreB}-${index}`}
                >

                  <td>{item.StoreA}</td>

                  <td>{item.StoreB}</td>

                  <td>
                    {Number(
                      item.SharedVisitors || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      item.OverlapPercentage || 0
                    ).toFixed(2)}%
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* VISITOR OVERLAP COMPARISON */}
        <section className="panel overlap-comparison-panel">

          <h3>Visitor Overlap Comparison</h3>

          <p>
            Compare shared visitor percentages across retail
            store pairs.
          </p>

          <div className="comparison-chart">

            {visitorOverlap.map((item, index) => {

              const overlap =
                Number(item.OverlapPercentage) || 0

              const barWidth =
                (overlap / maxOverlap) * 100

              return (
                <div
                  className="comparison-row"
                  key={`${item.StoreA}-${item.StoreB}-${index}`}
                >

                  <div className="comparison-header">
                    <span>
                      {item.StoreA} ↔ {item.StoreB}
                    </span>

                    <strong>
                      {overlap.toFixed(2)}%
                    </strong>
                  </div>

                  <div className="comparison-track">
                    <div
                      className="comparison-fill overlap-fill"
                      style={{
                        width: `${barWidth}%`
                      }}
                    ></div>
                  </div>

                </div>
              )
            })}

          </div>
        </section>

        {/* CANNIBALIZATION ANALYSIS */}
        <section className="panel">

          <h3>Cannibalization Analysis</h3>

          <p>
            Store pairs with overlapping visitors and
            cannibalization indicators.
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
                <tr
                  key={`${item.StoreA}-${item.StoreB}-${index}`}
                >

                  <td>{item.StoreA}</td>

                  <td>{item.StoreB}</td>

                  <td>
                    {Number(
                      item.SharedVisitors || 0
                    ).toLocaleString()}
                  </td>

                  <td>
                    {Number(
                      item.CannibalizationPercentage || 0
                    ).toFixed(2)}%
                  </td>

                  <td>
                    {item.CannibalizationIndicator}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ANALYTICS GRID */}
        <section className="content-grid">
{/* FOOTFALL COMPARISON */}
<section className="panel footfall-comparison-panel">

  <h3>Footfall Comparison</h3>

  <p>
    Compare GPS observations and unique visitors across retail stores.
  </p>

  <div className="footfall-chart">

    {stores
      .slice()
      .sort(
        (a, b) =>
          Number(b.UniqueVisitors || 0) -
          Number(a.UniqueVisitors || 0)
      )
      .map((store, index) => {

        const visitors = Number(store.UniqueVisitors || 0)

        const maxVisitors = Math.max(
          ...stores.map((item) =>
            Number(item.UniqueVisitors || 0)
          )
        )

        const barWidth =
          maxVisitors > 0
            ? (visitors / maxVisitors) * 100
            : 0

        return (
          <div
            className="footfall-row"
            key={`${store.StoreName}-${index}`}
          >

            <div className="footfall-header">
              <span>{store.StoreName}</span>

              <strong>{visitors.toLocaleString()}</strong>
            </div>

            <div className="footfall-track">
              <div
                className="footfall-fill"
                style={{
                  width: `${barWidth}%`
                }}
              ></div>
            </div>

          </div>
        )
      })}

  </div>

</section>

          {/* SPATIAL ANALYTICS */}
          <div className="panel spatial-analytics-panel">

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
              <strong>{averageDistance} m</strong>
            </div>

            <div className="analytics-item">
              <span>Stores Analyzed</span>
              <strong>{sedonaStores.length}</strong>
            </div>

            <div className="analytics-item">
              <span>250m Catchment Avg.</span>
              <strong>{averageWithin250m}%</strong>
            </div>

          </div>

          {/* MOBILITY INTELLIGENCE */}
          <div className="panel mobility-intelligence-panel">

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