import { useEffect, useMemo, useState } from 'react'
import './App.css'
import GeoPulseMap from './GeoPulseMap'

/* =========================================================
   CSV LOADER
   ========================================================= */

const loadCSV = async (filePath) => {
  const response = await fetch(filePath)

  if (!response.ok) {
    throw new Error(`Failed to load ${filePath}`)
  }

  const text = await response.text()

  if (!text.trim()) {
    return []
  }

  const rows = text.trim().split(/\r?\n/)

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

/* =========================================================
   HELPERS
   ========================================================= */

const numberValue = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const formatNumber = (value) => {
  return numberValue(value).toLocaleString()
}

const storeName = (store) => {
  return store.StoreName || 'Unknown Store'
}

/* =========================================================
   MINI LINE GRAPH
   ========================================================= */

function MiniLineChart({ data }) {
  const values = data
    .slice(0, 24)
    .map((item) => numberValue(item.UniqueVisitors))

  if (!values.length) {
    return (
      <div className="empty-chart">
        No hourly data available
      </div>
    )
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values)

  const points = values
    .map((value, index) => {
      const x =
        values.length === 1
          ? 50
          : (index / (values.length - 1)) * 100

      const y =
        88 -
        ((value - min) / Math.max(max - min, 1)) * 68

      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="mini-line-chart">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="geoLine"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          <linearGradient
            id="geoArea"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#8b5cf6"
              stopOpacity="0.35"
            />

            <stop
              offset="100%"
              stopColor="#8b5cf6"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <polygon
          points={`0,95 ${points} 100,95`}
          fill="url(#geoArea)"
        />

        <polyline
          points={points}
          fill="none"
          stroke="url(#geoLine)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />

        {values.map((value, index) => {
          const x =
            values.length === 1
              ? 50
              : (index / (values.length - 1)) * 100

          const y =
            88 -
            ((value - min) / Math.max(max - min, 1)) * 68

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill="#ffffff"
              stroke="#22d3ee"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
    </div>
  )
}

/* =========================================================
   CIRCULAR OVERLAP
   ========================================================= */

function CircularMetric({ value }) {
  const percentage = Math.min(
    100,
    Math.max(0, numberValue(value))
  )

  const radius = 43
  const circumference = 2 * Math.PI * radius
  const dash =
    (percentage / 100) * circumference

  return (
    <div className="circular-metric">
      <svg viewBox="0 0 110 110">
        <circle
          className="circle-track"
          cx="55"
          cy="55"
          r={radius}
        />

        <circle
          className="circle-progress"
          cx="55"
          cy="55"
          r={radius}
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>

      <div className="circle-content">
        <strong>
          {percentage.toFixed(1)}%
        </strong>

        <span>VISITOR OVERLAP</span>
      </div>
    </div>
  )
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [stores, setStores] = useState([])
  const [sedonaStores, setSedonaStores] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [visitorOverlap, setVisitorOverlap] = useState([])
  const [cannibalization, setCannibalization] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [minFootfall, setMinFootfall] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

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
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  /* =======================================================
     FILTERED STORES
     ======================================================= */

  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const name = storeName(store).toLowerCase()

      const matchesSearch =
        name.includes(searchTerm.toLowerCase())

      const matchesFootfall =
        numberValue(store.GPSObservations) >=
        Number(minFootfall || 0)

      return matchesSearch && matchesFootfall
    })
  }, [stores, searchTerm, minFootfall])

  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const totalPairs = visitorOverlap.length

  const averageOverlap =
    visitorOverlap.length > 0
      ? visitorOverlap.reduce(
          (sum, item) =>
            sum + numberValue(item.OverlapPercentage),
          0
        ) / visitorOverlap.length
      : 0

  const highCannibalization =
    cannibalization.filter(
      (item) =>
        String(
          item.CannibalizationIndicator || ''
        ).toLowerCase() === 'high'
    ).length

  const averageDistance =
    sedonaStores.length > 0
      ? sedonaStores.reduce(
          (sum, item) =>
            sum +
            numberValue(
              item.Average_Distance_Meters
            ),
          0
        ) / sedonaStores.length
      : 0

  const averageWithin250m =
    sedonaStores.length > 0
      ? sedonaStores.reduce(
          (sum, item) =>
            sum +
            numberValue(item.Percent_Within_250m),
          0
        ) / sedonaStores.length
      : 0

  const totalFootfall = stores.reduce(
    (sum, store) =>
      sum + numberValue(store.GPSObservations),
    0
  )

  const maxFootfall = Math.max(
    ...filteredStores.map(
      (store) => numberValue(store.GPSObservations)
    ),
    1
  )

  const topStores = [...filteredStores]
    .sort(
      (a, b) =>
        numberValue(b.GPSObservations) -
        numberValue(a.GPSObservations)
    )
    .slice(0, 5)

  const topOverlapPairs = [...visitorOverlap]
    .sort(
      (a, b) =>
        numberValue(b.OverlapPercentage) -
        numberValue(a.OverlapPercentage)
    )
    .slice(0, 5)

  const highPairs = cannibalization
    .filter(
      (item) =>
        String(
          item.CannibalizationIndicator || ''
        ).toLowerCase() === 'high'
    )
    .slice(0, 5)
    // Combine hourly records into one value per hour
  const hourlySummary = useMemo(() => {
    const grouped = {}

    hourlyData.forEach((row) => {
      const rawHour =
        row.Hour ??
        row.hour ??
        row.HourOfDay

      const hour = Number(
        String(rawHour ?? '0')
          .replace(':00', '')
      )

      const value = numberValue(
        row.UniqueVisitors ??
        row.Visitors ??
        row.Footfall ??
        row.GPSObservations
      )

      if (!grouped[hour]) {
        grouped[hour] = 0
      }

      grouped[hour] += value
    })

    return Array.from(
      { length: 24 },
      (_, hour) => ({
        hour,
        value: grouped[hour] || 0
      })
    )
  }, [hourlyData])
  const peakHourData =
  hourlySummary.length > 0
    ? [...hourlySummary].sort(
        (a, b) => b.value - a.value
      )[0]
    : null
  const visitorFootfallAverage =
  stores.length > 0
    ? stores.reduce(
        (sum, store) =>
          sum +
          numberValue(store.UniqueVisitors),
        0
      ) / stores.length
    : 0

const footfallAverage =
  stores.length > 0
    ? stores.reduce(
        (sum, store) =>
          sum +
          numberValue(store.GPSObservations),
        0
      ) / stores.length
    : 0

const highVisitorHighFootfall =
  stores.filter(
    (store) =>
      numberValue(store.UniqueVisitors) >=
        visitorFootfallAverage &&
      numberValue(store.GPSObservations) >=
        footfallAverage
  ).length

const lowVisitorHighFootfall =
  stores.filter(
    (store) =>
      numberValue(store.UniqueVisitors) <
        visitorFootfallAverage &&
      numberValue(store.GPSObservations) >=
        footfallAverage
  ).length
  
    /* =======================================================
     EXECUTIVE INSIGHTS
     ======================================================= */

  const topStore = topStores[0] || null

  const highestVisitorStore =
    [...stores].sort(
      (a, b) =>
        numberValue(b.UniqueVisitors) -
        numberValue(a.UniqueVisitors)
    )[0] || null

  const closestCatchment =
    [...sedonaStores].sort(
      (a, b) =>
        numberValue(a.Average_Distance_Meters) -
        numberValue(b.Average_Distance_Meters)
    )[0] || null

  const highestOverlapPair =
    [...visitorOverlap].sort(
      (a, b) =>
        numberValue(b.OverlapPercentage) -
        numberValue(a.OverlapPercentage)
    )[0] || null
  const peakHour =
  hourlySummary.length > 0
    ? [...hourlySummary].sort(
        (a, b) => b.value - a.value
      )[0]
    : null
   
  /* =======================================================
     RESET
     ======================================================= */

  const resetFilters = () => {
    setSearchTerm('')
    setMinFootfall(0)
  }

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-orbit">
          <span />
          <span />
          <span />
        </div>

        <h2>Loading GeoPulse</h2>

        <p>
          Preparing mobility intelligence...
        </p>
      </div>
    )
  }

  /* =======================================================
     DASHBOARD
     ======================================================= */

  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div className="brand-area">

          <div className="brand-symbol">
            GP
          </div>

          <div>
            <h1>GeoPulse</h1>

            <p>
              Hyper-Local Retail Mobility Analytics
            </p>
          </div>

        </div>

        <div className="header-center">

          <div className="header-chip active">
            <span />
            LIVE ANALYTICS
          </div>

          <div className="header-chip">
            MOBILITY INTELLIGENCE
          </div>

        </div>

        <div className="header-right">

          <div className="data-status">
            <span className="status-dot" />
            DATA CONNECTED
          </div>

        </div>

      </header>

      <main className="dashboard">

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero-panel">

          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <div className="hero-content">

            <div>

              <div className="eyebrow">
                GEOSPATIAL RETAIL ANALYTICS
              </div>

              <h2>
                Understand where{' '}
                <span>people move.</span>
              </h2>

              <p>
                Transform anonymized mobility data
                into actionable retail intelligence
                through footfall, catchment, distance,
                and visitor behavior analysis.
              </p>

            </div>

            <div className="hero-orbit">

              <div className="orbit-ring ring-one" />
              <div className="orbit-ring ring-two" />
              <div className="orbit-ring ring-three" />

              <div className="orbit-core">
                <span>GEO</span>
                <strong>PULSE</strong>
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <section className="visual-kpi-grid">

          <div className="visual-kpi cyan-card">

            <div className="kpi-top">
              <span>ACTIVE STORES</span>

              <div className="kpi-icon">
                ◈
              </div>
            </div>

            <strong>
              {String(stores.length).padStart(2, '0')}
            </strong>

            <div className="kpi-bottom">
              <span className="positive">
                ● LIVE
              </span>

              <small>
                Retail locations
              </small>
            </div>

            <div className="kpi-wave">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

          </div>

          <div className="visual-kpi purple-card">

            <div className="kpi-top">
              <span>GPS OBSERVATIONS</span>

              <div className="kpi-icon">
                ⌁
              </div>
            </div>

            <strong>
  {formatNumber(
    stores.reduce(
      (sum, store) => sum + numberValue(store.GPSObservations),
      0
    )
  )}
</strong>

            <div className="kpi-bottom">
              <span className="positive">
                +12.4%
              </span>

              <small>
                Mobility records
              </small>
            </div>

            <div className="mini-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>

          </div>

          <div className="visual-kpi blue-card">

            <div className="kpi-top">
              <span>UNIQUE DEVICES</span>

              <div className="kpi-icon">
                ◎
              </div>
            </div>

            <strong>
  {formatNumber(
    stores.reduce(
      (sum, store) => sum + numberValue(store.UniqueVisitors),
      0
    )
  )}
</strong>

            <div className="kpi-bottom">
              <span className="positive">
                +8.6%
              </span>

              <small>
                Distinct visitors
              </small>
            </div>

            <div className="device-dots">
              {Array.from({ length: 18 }).map(
                (_, index) => (
                  <i key={index} />
                )
              )}
            </div>

          </div>

          <div className="visual-kpi pink-card">

            <div className="kpi-top">
              <span>VISITOR OVERLAP</span>

              <div className="kpi-icon">
                ◉
              </div>
            </div>

            <strong>
              {averageOverlap.toFixed(2)}%
            </strong>

            <div className="kpi-bottom">
              <span className="warning">
                HIGH
              </span>

              <small>
                Store pair overlap
              </small>
            </div>

            <div className="overlap-meter">
              <div
                style={{
                  width: `${Math.min(
                    averageOverlap,
                    100
                  )}%`
                }}
              />
            </div>

          </div>

          <div className="visual-kpi orange-card">

            <div className="kpi-top">
              <span>HIGH SIGNALS</span>

              <div className="kpi-icon">
                △
              </div>
            </div>

            <strong>
              {highCannibalization}
            </strong>

            <div className="kpi-bottom">
              <span className="warning">
                ATTENTION
              </span>

              <small>
                Cannibalization pairs
              </small>
            </div>

            <div className="signal-lines">
              <span />
              <span />
              <span />
            </div>

          </div>

        </section>

        {/* =================================================
            MAP + INTELLIGENCE
        ================================================= */}

        <section className="main-visual-grid">

          <div className="visual-panel map-visual-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  SPATIAL INTELLIGENCE
                </span>

                <h2>
                  GeoPulse Store Intelligence Map
                </h2>
              </div>

              <div className="panel-live">
                <span />
                LIVE
              </div>

            </div>

            <div className="map-visual">

              <GeoPulseMap />

              <div className="map-overlay">

                <div>
                  <span>RADIUS</span>
                  <strong>500m</strong>
                </div>

                <div>
                  <span>OBSERVATIONS</span>
                  <strong>50K</strong>
                </div>

                <div>
                  <span>STORES</span>
                  <strong>{stores.length}</strong>
                </div>

              </div>

            </div>

          </div>

          <div className="visual-panel intelligence-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  MOBILITY INTELLIGENCE
                </span>

                <h2>
                  Catchment Signal
                </h2>
              </div>

            </div>

            <div className="circular-section">

              <CircularMetric
                value={averageOverlap}
              />

              <div className="signal-list">

                <div className="signal-item">

                  <span className="signal-icon cyan">
                    ◎
                  </span>

                  <div>
                    <small>
                      Catchment radius
                    </small>

                    <strong>
                      500 m
                    </strong>
                  </div>

                  <b>
                    ACTIVE
                  </b>

                </div>

                <div className="signal-item">

                  <span className="signal-icon purple">
                    ◇
                  </span>

                  <div>
                    <small>
                      Average distance
                    </small>

                    <strong>
                      {averageDistance.toFixed(1)} m
                    </strong>
                  </div>

                  <b>
                    ANALYZED
                  </b>

                </div>

                <div className="signal-item">

                  <span className="signal-icon pink">
                    ◉
                  </span>

                  <div>
                    <small>
                      Store pairs
                    </small>

                    <strong>
                      {totalPairs}
                    </strong>
                  </div>

                  <b>
                    COMPARED
                  </b>

                </div>

              </div>

            </div>

            <div className="intelligence-footer">

              <div>
                <span>
                  250M CATCHMENT COVERAGE
                </span>

                <strong>
                  {averageWithin250m.toFixed(1)}%
                </strong>
              </div>

              <div className="signal-progress">
                <div
                  style={{
                    width: `${Math.min(
                      averageWithin250m,
                      100
                    )}%`
                  }}
                />
              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            HOURLY + STORE PERFORMANCE
        ================================================= */}

        <section className="analytics-two-column">

          <div className="visual-panel hourly-visual">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  TEMPORAL ANALYTICS
                </span>

                <h2>
                  Hourly Footfall Trend
                </h2>
              </div>

              <div className="metric-pill">
                24 HOURS
              </div>

            </div>

            <div className="chart-summary">

              <div>
                <small>
                  TOTAL OBSERVATIONS
                </small>

                <strong>
                  {formatNumber(totalFootfall)}
                </strong>
              </div>

              <div>
                <small>
                  ACTIVITY SIGNAL
                </small>

                <strong className="cyan-text">
                  ACTIVE
                </strong>
              </div>

            </div>

            <MiniLineChart
              data={hourlyData}
            />

            <div className="chart-axis">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>

          </div>

          <div className="visual-panel performance-visual">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  STORE INTELLIGENCE
                </span>

                <h2>
                  Store Performance
                </h2>
              </div>

              <div className="metric-pill">
                TOP 5
              </div>

            </div>

            <div className="store-bars">

              {topStores.map((store, index) => {

                const footfall =
                  numberValue(
                    store.GPSObservations
                  )

                const width =
                  (footfall / maxFootfall) * 100

                return (
                  <div
                    className="store-bar-row"
                    key={store.StoreID || index}
                  >

                    <div className="store-rank">
                      0{index + 1}
                    </div>

                    <div className="store-bar-content">

                      <div className="store-bar-label">

                        <span>
                          {storeName(store)}
                        </span>

                        <strong>
                          {formatNumber(footfall)}
                        </strong>

                      </div>

                      <div className="store-bar-track">

                        <div
                          className="store-bar-fill"
                          style={{
                            width: `${width}%`
                          }}
                        />

                      </div>

                    </div>

                  </div>
                )
              })}

            </div>

          </div>

        </section>

        {/* =================================================
            DATA EXPLORER
        ================================================= */}

        <section className="filter-visual-panel">

          <div className="filter-title">

            <span className="panel-kicker">
              DATA EXPLORER
            </span>

            <h2>
              Explore Store Signals
            </h2>

          </div>

          <div className="visual-filters">

            <div className="visual-input">

              <span>⌕</span>

              <input
                type="text"
                placeholder="Search store..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="visual-input">

              <span>◫</span>

              <input
                type="number"
                min="0"
                placeholder="Minimum footfall..."
                value={minFootfall || ''}
                onChange={(event) =>
                  setMinFootfall(
                    Number(event.target.value) || 0
                  )
                }
              />

            </div>

            <button
              className="aurora-button"
              type="button"
              onClick={resetFilters}
            >
              RESET FILTERS
            </button>

          </div>

        </section>

        {/* =================================================
            OVERLAP + CANNIBALIZATION
        ================================================= */}

        <section className="analytics-two-column">

          <div className="visual-panel overlap-visual">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  VISITOR BEHAVIOR
                </span>

                <h2>
                  Visitor Overlap
                </h2>
              </div>

              <div className="metric-pill purple-pill">
                {totalPairs} PAIRS
              </div>

            </div>

            <div className="overlap-list">

              {topOverlapPairs.map(
                (item, index) => {

                  const overlap =
                    numberValue(
                      item.OverlapPercentage
                    )

                  return (
                    <div
                      className="overlap-row"
                      key={`${item.StoreA}-${item.StoreB}-${index}`}
                    >

                      <div className="overlap-nodes">

                        <span>
                          {item.StoreA}
                        </span>

                        <div className="connection">
                          <i />
                          <i />
                          <i />
                        </div>

                        <span>
                          {item.StoreB}
                        </span>

                      </div>

                      <div className="overlap-bar">

                        <div
                          style={{
                            width: `${Math.min(
                              overlap,
                              100
                            )}%`
                          }}
                        />

                      </div>

                      <strong>
                        {overlap.toFixed(2)}%
                      </strong>

                    </div>
                  )
                }
              )}

            </div>

          </div>

          <div className="visual-panel cannibalization-visual">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  STORE RELATIONSHIPS
                </span>

                <h2>
                  Cannibalization Signals
                </h2>
              </div>

              <div className="danger-pill">
                {highCannibalization} HIGH
              </div>

            </div>

            <div className="relationship-map">

              {highPairs.map(
                (item, index) => {

                  const first =
                    item.StoreA || 'Store A'

                  const second =
                    item.StoreB || 'Store B'

                  return (
                    <div
                      className="relationship-card"
                      key={`${first}-${second}-${index}`}
                    >

                      <div className="relation-store">

                        <div className="relation-node">
                          {first
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span>
                          {first}
                        </span>

                      </div>

                      <div className="relation-line">

                        <span>
                          HIGH
                        </span>

                        <div />

                      </div>

                      <div className="relation-store">

                        <div className="relation-node second">
                          {second
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span>
                          {second}
                        </span>

                      </div>

                    </div>
                  )
                }
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            SPATIAL INTELLIGENCE
        ================================================= */}

        <section className="bottom-intelligence-grid">

          <div className="visual-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  SPATIAL ANALYTICS
                </span>

                <h2>
                  Catchment Intelligence
                </h2>
              </div>

            </div>

            <div className="intelligence-grid">

              <div className="intelligence-card cyan-border">

                <span>
                  CATCHMENT RADIUS
                </span>

                <strong>
                  500m
                </strong>

                <div className="radar-mini">
                  <i />
                  <i />
                  <i />
                </div>

              </div>

              <div className="intelligence-card purple-border">

                <span>
                  STORES ANALYZED
                </span>

                <strong>
                  {sedonaStores.length}
                </strong>

                <div className="tiny-wave">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>

              </div>

              <div className="intelligence-card pink-border">

                <span>
                  AVG DISTANCE
                </span>

                <strong>
                  {averageDistance.toFixed(0)}m
                </strong>

                <div className="distance-line">
                  <span />
                </div>

              </div>

            </div>

          </div>

          {/* MOBILITY */}

          <div className="visual-panel">

            <div className="panel-heading">

              <div>
                <span className="panel-kicker">
                  MOBILITY INTELLIGENCE
                </span>

                <h2>
                  Signal Overview
                </h2>
              </div>

            </div>

            <div className="signal-overview">

              <div className="overview-stat">

                <div className="overview-icon cyan">
                  ◉
                </div>

                <div>
                  <small>
                    GPS RECORDS
                  </small>

                  <strong>
                    50K
                  </strong>
                </div>

              </div>

              <div className="overview-stat">

                <div className="overview-icon purple">
                  ◇
                </div>

                <div>
                  <small>
                    UNIQUE DEVICES
                  </small>

                  <strong>
                    1K
                  </strong>
                </div>

              </div>

              <div className="overview-stat">

                <div className="overview-icon pink">
                  △
                </div>

                <div>
                  <small>
                    STORE PAIRS
                  </small>

                  <strong>
                    {totalPairs}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="dashboard-footer">

          <div className="footer-brand">

            <span className="footer-dot" />

            GeoPulse Analytics Engine

          </div>

          <div>
            Hyper-Local Retail Mobility Intelligence
          </div>

          <div>
  {stores.length} stores ·{' '}
  {formatNumber(
    stores.reduce(
      (sum, store) => sum + numberValue(store.GPSObservations),
      0
    )
  )}{' '}
  observations
</div>

        </footer>

      </main>
      <section className="executive-insights">

  <div className="insights-heading">
    <div>
      <span className="section-kicker">EXECUTIVE INTELLIGENCE</span>
      <h2>Key Mobility Findings</h2>
      <p>Automatically derived from the current GeoPulse dataset.</p>
    </div>

    <div className="insight-status">
      <span></span>
      ANALYSIS READY
    </div>
  </div>

  <div className="insight-grid">

    <div className="insight-card insight-cyan">
      <div className="insight-icon">🏆</div>
      <div className="insight-content">
        <span>TOP FOOTFALL STORE</span>
        <strong>
          {topStore ? storeName(topStore) : '—'}
        </strong>
        <small>
          {topStore
            ? `${formatNumber(topStore.GPSObservations)} observations`
            : 'No data available'}
        </small>
      </div>
    </div>

    <div className="insight-card insight-purple">
      <div className="insight-icon">👥</div>
      <div className="insight-content">
        <span>VISITOR LEADER</span>
        <strong>
          {highestVisitorStore
            ? storeName(highestVisitorStore)
            : '—'}
        </strong>
        <small>
          {highestVisitorStore
            ? `${formatNumber(highestVisitorStore.UniqueVisitors)} unique visitors`
            : 'No data available'}
        </small>
      </div>
    </div>

    <div className="insight-card insight-blue">
      <div className="insight-icon">📍</div>
      <div className="insight-content">
        <span>CLOSEST CATCHMENT</span>
        <strong>
          {closestCatchment
            ? closestCatchment.StoreName ||
              closestCatchment.Store ||
              'Store'
            : '—'}
        </strong>
        <small>
          {closestCatchment
            ? `${numberValue(closestCatchment.Average_Distance_Meters).toFixed(0)} m average distance`
            : 'No data available'}
        </small>
      </div>
    </div>

    <div className="insight-card insight-pink">
      <div className="insight-icon">◉</div>
      <div className="insight-content">
        <span>HIGHEST VISITOR OVERLAP</span>
        <strong>
          {highestOverlapPair
            ? `${highestOverlapPair.StoreA} ↔ ${highestOverlapPair.StoreB}`
            : '—'}
        </strong>
        <small>
          {highestOverlapPair
            ? `${numberValue(highestOverlapPair.OverlapPercentage).toFixed(2)}% visitor overlap`
            : 'No data available'}
        </small>
      </div>
    </div>

    <div className="insight-card insight-orange">
      <div className="insight-icon">⚡</div>
      <div className="insight-content">
        <span>PEAK ACTIVITY</span>
        <strong>
  {peakHour
    ? `${String(peakHour.hour).padStart(2, '0')}:00`
    : '—'}
</strong>
       <small>
  {peakHour
    ? `${formatNumber(peakHour.value)} activity`
    : 'No data available'}
</small>
      </div>
    </div>

    <div className="insight-card insight-green">
      <div className="insight-icon">⚠</div>
      <div className="insight-content">
        <span>HIGH-OVERLAP PAIRS</span>
        <strong>{highCannibalization}</strong>
        <small>Store pairs flagged by the current analysis</small>
      </div>
    </div>

  </div>

</section>


      
      <section className="advanced-analytics">

  <div className="advanced-header">
    <div>
      <span className="chart-label">ANALYTICS COMMAND CENTER</span>

      <h2>Advanced Retail Intelligence</h2>

      <p>
        Explore visitor behavior, footfall patterns, spatial reach,
        and store competition across the retail network.
      </p>
    </div>

    <div className="advanced-status">
      <span className="status-dot"></span>
      LIVE ANALYTICS
    </div>
  </div>

  <div className="analytics-chart-grid">
    {/* Visitor Share */}
    <div className="analytics-chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-label">VISITOR DISTRIBUTION</span>
          <h3>Visitor Share by Store</h3>
        </div>
        <span className="chart-icon cyan-icon">◉</span>
      </div>

      <div className="donut-wrapper">
        <div
  className="donut-chart"
  style={{
    background: `conic-gradient(
      var(--cyan) 0% ${numberValue(stores[0]?.VisitorSharePercentage)},
      var(--purple) ${numberValue(stores[0]?.VisitorSharePercentage)}% ${numberValue(stores[0]?.VisitorSharePercentage) + numberValue(stores[1]?.VisitorSharePercentage)}%,
      var(--pink) ${numberValue(stores[0]?.VisitorSharePercentage) + numberValue(stores[1]?.VisitorSharePercentage)}% ${numberValue(stores[0]?.VisitorSharePercentage) + numberValue(stores[1]?.VisitorSharePercentage) + numberValue(stores[2]?.VisitorSharePercentage)}%,
      var(--orange) ${numberValue(stores[0]?.VisitorSharePercentage) + numberValue(stores[1]?.VisitorSharePercentage) + numberValue(stores[2]?.VisitorSharePercentage)}% ${numberValue(stores[0]?.VisitorSharePercentage) + numberValue(stores[1]?.VisitorSharePercentage) + numberValue(stores[2]?.VisitorSharePercentage) + numberValue(stores[3]?.VisitorSharePercentage)}%,
      var(--green) ${numberValue(stores[0]?.VisitorSharePercentage) + numberValue(stores[1]?.VisitorSharePercentage) + numberValue(stores[2]?.VisitorSharePercentage) + numberValue(stores[3]?.VisitorSharePercentage)}% 100%
    )`
  }}
>
          <div className="donut-center">
            <strong>{stores.length}</strong>
            <span>Stores</span>
          </div>
        </div>

        <div className="donut-legend">
          {stores.map((store, index) => (
            <div className="legend-row" key={storeName(store)}>
              <span className={`legend-dot dot-${index % 5}`}></span>
              <span>{storeName(store)}</span>
              <strong>
                {numberValue(store.VisitorSharePercentage).toFixed(1)}%
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Footfall */}
    <div className="analytics-chart-card wide-chart">
      <div className="chart-card-header">
        <div>
          <span className="chart-label">STORE PERFORMANCE</span>
          <h3>Footfall Comparison</h3>
        </div>
        <span className="chart-icon orange-icon">▥</span>
      </div>

      <div className="advanced-bars">
        {topStores.map((store, index) => {
          const value = numberValue(store.GPSObservations);
          const percentage = maxFootfall
            ? (value / maxFootfall) * 100
            : 0;

          return (
            <div className="advanced-bar-row" key={storeName(store)}>
              <div className="advanced-bar-title">
                <span>{storeName(store)}</span>
                <strong>{formatNumber(value)}</strong>
              </div>

              <div className="advanced-bar-track">
                <div
                  className={`advanced-bar-fill fill-${index % 5}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

  </div>
  <div className="analytics-chart-grid second-chart-row">

  {/* HOURLY TRAFFIC */}
  <div className="analytics-chart-card wide-chart">
    <div className="chart-card-header">
      <div>
        <span className="chart-label">MOBILITY TIMELINE</span>
        <h3>Hourly Footfall Activity</h3>
      </div>
      <span className="chart-icon blue-icon">⌁</span>
    </div>

    <div className="hourly-advanced-chart">
  {hourlySummary.map((row, index) => {

    const maxValue = Math.max(
      ...hourlySummary.map(
        (item) => item.value
      ),
      1
    )

    const height = Math.max(
      (row.value / maxValue) * 100,
      row.value > 0 ? 5 : 0
    )

    return (
      <div
        className="hour-column"
        key={row.hour}
      >

        <div className="hour-value">
          {formatNumber(row.value)}
        </div>

        <div className="hour-bar-area">
          <div
            className={`hour-bar hour-color-${index % 5}`}
            style={{
              height: `${height}%`
            }}
          ></div>
        </div>

        <span>
          {String(row.hour).padStart(2, '0')}
        </span>

      </div>
    )
  })}
</div>
    
  </div>

  {/* PEAK INTELLIGENCE */}
  <div className="analytics-chart-card peak-card">
    <div className="chart-card-header">
      <div>
        <span className="chart-label">TRAFFIC INTELLIGENCE</span>
        <h3>Peak Activity</h3>
      </div>
      <span className="chart-icon pink-icon">⚡</span>
    </div>

    <div className="peak-stat">
  <span>PEAK TRAFFIC</span>

  <strong>
    {peakHourData
      ? formatNumber(peakHourData.value)
      : "0"}
  </strong>

  <small>
    Peak activity at{" "}
    {peakHourData
      ? `${String(peakHourData.hour).padStart(2, "0")}:00`
      : "--"}
  </small>
</div>

    <div className="peak-metrics">
      <div>
        <span>STORES</span>
        <strong>{stores.length}</strong>
      </div>

      <div>
        <span>PAIRS</span>
        <strong>{totalPairs}</strong>
      </div>

      <div>
        <span>HIGH RISK</span>
        <strong>{highCannibalization}</strong>
      </div>
    </div>
  </div>

</div>
<div className="analytics-chart-grid third-chart-row">

  {/* VISITOR VS FOOTFALL */}
  <div className="analytics-chart-card">
    <div className="chart-card-header">
      <div>
        <span className="chart-label">STORE RELATIONSHIP</span>
        <h3>Visitors vs Footfall</h3>
      </div>
      <span className="chart-icon green-icon">✦</span>
    </div>

    <div className="relationship-chart">

  {stores.map((store, index) => {

    const visitors = numberValue(
      store.UniqueVisitors
    )

    const footfall = numberValue(
      store.GPSObservations
    )

    const maxVisitors = Math.max(
      ...stores.map((s) =>
        numberValue(s.UniqueVisitors)
      ),
      1
    )

    const maxFootfallValue = Math.max(
      ...stores.map((s) =>
        numberValue(s.GPSObservations)
      ),
      1
    )

    const left =
      6 +
      (visitors / maxVisitors) * 88

    const bottom =
      8 +
      (footfall / maxFootfallValue) * 82

    return (
      <div
        className="relationship-point"
        key={storeName(store)}
        style={{
          left: `${Math.min(left, 94)}%`,
          bottom: `${Math.min(bottom, 92)}%`
        }}
      >

        <div
          className={`scatter-point scatter-${index % 5}`}
        >
          <span>{index + 1}</span>
        </div>

        <div className="scatter-tooltip">

          <strong>
            {storeName(store)}
          </strong>

          <span>
            Visitors: {formatNumber(visitors)}
          </span>

          <span>
            Footfall: {formatNumber(footfall)}
          </span>

        </div>

      </div>
    )
  })}

  <div className="scatter-y-label">
    HIGH FOOTFALL
  </div>

  <div className="scatter-y-low">
    LOW FOOTFALL
  </div>

  <div className="scatter-axis">
    <span>LOW VISITORS</span>
    <span>HIGH VISITORS</span>
  </div>
  <div className="scatter-legend">
  {stores.map((store, index) => (
    <div
      className="scatter-legend-item"
      key={`legend-${storeName(store)}`}
    >
      <span
        className={`legend-store-dot scatter-${index % 5}`}
      >
        {index + 1}
      </span>

      <span>
        {storeName(store)}
      </span>
    </div>
  ))}
</div>
<div className="relationship-summary">

  <div className="relationship-summary-title">
    <span className="chart-label">
      RELATIONSHIP INTELLIGENCE
    </span>

    <strong>
      Store Activity Segmentation
    </strong>
  </div>

  <div className="relationship-summary-grid">

    <div className="relationship-summary-item summary-green">
      <span>HIGH VISITORS + HIGH FOOTFALL</span>
      <strong>{highVisitorHighFootfall}</strong>
      <small>stores</small>
    </div>

    <div className="relationship-summary-item summary-orange">
      <span>LOW VISITORS + HIGH FOOTFALL</span>
      <strong>{lowVisitorHighFootfall}</strong>
      <small>stores</small>
    </div>

    <div className="relationship-summary-item summary-blue">
      <span>AVERAGE VISITORS</span>
      <strong>
        {formatNumber(visitorFootfallAverage)}
      </strong>
      <small>per store</small>
    </div>

    <div className="relationship-summary-item summary-purple">
      <span>AVERAGE FOOTFALL</span>
      <strong>
        {formatNumber(footfallAverage)}
      </strong>
      <small>per store</small>
    </div>

  </div>

</div>


</div>
  </div>


  {/* CANNIBALIZATION RANKING */}
  <div className="analytics-chart-card wide-chart">
    <div className="chart-card-header">
      <div>
        <span className="chart-label">SPATIAL COMPETITION</span>
        <h3>Cannibalization Pair Analysis</h3>
      </div>
      <span className="chart-icon orange-icon">⚠</span>
    </div>

    <div className="cannibal-bars">
     {topOverlapPairs.map((pair, index) => {
  const overlap = numberValue(
    pair.OverlapPercentage ??
    pair.Overlap_Percentage ??
    pair.Overlap
  );

  const risk =
    overlap >= 80
      ? 'HIGH'
      : overlap >= 50
        ? 'MEDIUM'
        : 'LOW';

  const riskClass =
    risk === 'HIGH'
      ? 'risk-high'
      : risk === 'MEDIUM'
        ? 'risk-medium'
        : 'risk-low';

  return (
    <div className="cannibal-row" key={index}>

      <div className="cannibal-label">
        <span>
          {pair.StoreA} <b>↔</b> {pair.StoreB}
        </span>

        <strong>
          {overlap.toFixed(1)}%
        </strong>
      </div>

      <div className="cannibal-track">
        <div
          className={`cannibal-fill ${riskClass}`}
          style={{
            width: `${Math.min(overlap, 100)}%`
          }}
        />
      </div>

      <span className={`cannibal-risk ${riskClass}`}>
        {risk}
      </span>

    </div>
  );
})}
    </div>

    <div className="cannibal-note">
      <span>●</span>
      High overlap indicates strong visitor-area similarity between store pairs.
    </div>
  </div>

</div>

<div className="analytics-chart-grid fourth-chart-row">

  {/* CATCHMENT DISTANCE */}
  <div className="analytics-chart-card wide-chart">
    <div className="chart-card-header">
      <div>
        <span className="chart-label">GEOSPATIAL ANALYTICS</span>
        <h3>Store Catchment Distance</h3>
      </div>
      <span className="chart-icon blue-icon">⌖</span>
    </div>

    <div className="distance-grid">
      {sedonaStores.map((store, index) => {
        const distance = numberValue(
          store.Average_Distance_Meters ??
          store.AverageDistanceMeters ??
          store.Average_Distance
        );

        const within250 = numberValue(
          store.Percent_Within_250m ??
          store.PercentWithin250m
        );

        const maxDistance = Math.max(
          ...sedonaStores.map((s) =>
            numberValue(
              s.Average_Distance_Meters ??
              s.AverageDistanceMeters ??
              s.Average_Distance
            )
          ),
          1
        );

        return (
          <div className="distance-card" key={index}>
            <div className="distance-card-top">
              <span className={`distance-number distance-${index % 5}`}>
                {index + 1}
              </span>

              <strong>
                {store.StoreName ??
                  store.Store ??
                  store.store_name ??
                  `Store ${index + 1}`}
              </strong>
            </div>

            <div className="distance-value">
              {distance.toFixed(0)}
              <small> m avg distance</small>
            </div>

            <div className="distance-track">
              <div
                className={`distance-fill distance-fill-${index % 5}`}
                style={{
                  width: `${Math.min(
                    (distance / maxDistance) * 100,
                    100
                  )}%`
                }}
              ></div>
            </div>

            <div className="distance-footer">
              <span>Within 250m</span>
              <strong>{within250.toFixed(1)}%</strong>
            </div>
          </div>
        );
      })}
    </div>
  </div>



  {/* CATCHMENT SUMMARY */}
  <div className="analytics-chart-card catchment-summary-card">
    <div className="chart-card-header">
      <div>
        <span className="chart-label">CATCHMENT INTELLIGENCE</span>
        <h3>Spatial Summary</h3>
      </div>
      <span className="chart-icon purple-icon">◈</span>
    </div>

    <div className="spatial-orbit">
      <div className="orbit-ring orbit-ring-one"></div>
      <div className="orbit-ring orbit-ring-two"></div>

      <div className="orbit-core">
        <strong>
          {averageWithin250m.toFixed(1)}%
        </strong>
        <span>Within 250m</span>
      </div>
    </div>

    <div className="spatial-stats">
      <div>
        <span>AVG DISTANCE</span>
        <strong>{averageDistance.toFixed(0)} m</strong>
      </div>

      <div>
        <span>STORE LOCATIONS</span>
        <strong>{stores.length}</strong>
      </div>

      <div>
        <span>VISITOR PAIRS</span>
        <strong>{totalPairs}</strong>
      </div>
    </div>
  </div>

</div>
{/* =========================================================
    FIFTH ANALYTICS ROW
========================================================= */}

<div className="analytics-chart-grid fifth-chart-row">

  {/* 250m Visitor Coverage */}
  <div className="analytics-chart-card reach-card">

    <div className="analytics-card-header">
      <div>
        <span className="analytics-kicker">CATCHMENT REACH</span>
        <h3>250m Visitor Coverage</h3>
      </div>

      <span className="analytics-badge">SPATIAL</span>
    </div>

    <div className="reach-visual">

      <div
        className="reach-donut"
        style={{
          background: `conic-gradient(
            var(--cyan) ${averageWithin250m}%,
            rgba(255,255,255,0.08) ${averageWithin250m}% 100%
          )`
        }}
      >
        <div className="reach-center">
          <strong>{averageWithin250m.toFixed(1)}%</strong>
          <span>Within 250m</span>
        </div>
      </div>

      <div className="reach-legend">

        <div className="reach-legend-item">
          <span className="legend-dot cyan-dot"></span>
          <div>
            <strong>{averageWithin250m.toFixed(1)}%</strong>
            <span>Covered visitors</span>
          </div>
        </div>

        <div className="reach-legend-item">
          <span className="legend-dot muted-dot"></span>
          <div>
            <strong>{(100 - averageWithin250m).toFixed(1)}%</strong>
            <span>Outside 250m</span>
          </div>
        </div>

      </div>

    </div>

    <div className="reach-footer">
      <span>Average spatial reach across stores</span>
      <span className="metric-pill">
        {averageWithin250m >= 70 ? 'STRONG REACH' : 'REVIEW REACH'}
      </span>
    </div>

  </div>


  {/* Cannibalization Distribution */}
  <div className="analytics-chart-card risk-card">

    <div className="analytics-card-header">
      <div>
        <span className="analytics-kicker">NETWORK RISK</span>
        <h3>Cannibalization Distribution</h3>
      </div>

      <span className="analytics-badge danger-badge">RISK</span>
    </div>

    <div className="risk-distribution">

      {[
        {
          label: 'High',
          value: cannibalization.filter(
            item =>
              String(item.CannibalizationIndicator || '')
                .toLowerCase() === 'high'
          ).length,
          className: 'risk-high'
        },
        {
          label: 'Medium',
          value: cannibalization.filter(
            item =>
              String(item.CannibalizationIndicator || '')
                .toLowerCase() === 'medium'
          ).length,
          className: 'risk-medium'
        },
        {
          label: 'Low',
          value: cannibalization.filter(
            item =>
              String(item.CannibalizationIndicator || '')
                .toLowerCase() === 'low'
          ).length,
          className: 'risk-low'
        }
      ].map(item => {

        const percentage =
          cannibalization.length > 0
            ? (item.value / cannibalization.length) * 100
            : 0

        return (
          <div className="risk-level" key={item.label}>

            <div className="risk-level-header">
              <span>{item.label}</span>
              <strong>{item.value} pairs</strong>
            </div>

            <div className="risk-track">
              <div
                className={`risk-fill ${item.className}`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="risk-percentage">
              {percentage.toFixed(1)}%
            </div>

          </div>
        )
      })}

    </div>

    <div className="risk-summary">
      <div>
        <span>Analyzed pairs</span>
        <strong>{cannibalization.length}</strong>
      </div>

      <div>
        <span>High signal</span>
        <strong>{highCannibalization}</strong>
      </div>

      <div>
        <span>Average overlap</span>
        <strong>{averageOverlap.toFixed(1)}%</strong>
      </div>
    </div>

  </div>

</div>
{/* =========================================================
    SIXTH ANALYTICS ROW
========================================================= */}

<div className="analytics-chart-grid sixth-chart-row">

  <div className="analytics-chart-card network-risk-card">

    <div className="analytics-card-header">
      <div>
        <span className="analytics-kicker">
          NETWORK INTELLIGENCE
        </span>

        <h3>Store Network Risk Matrix</h3>
      </div>

      <span className="analytics-badge danger-badge">
        OVERLAP
      </span>
    </div>

    <div className="network-risk-list">

      {topOverlapPairs.map((pair, index) => {

        const overlap = numberValue(
          pair.OverlapPercentage
        );

        const risk =
          overlap >= 80
            ? 'HIGH'
            : overlap >= 50
              ? 'MEDIUM'
              : 'LOW';

        const riskClass =
          risk === 'HIGH'
            ? 'network-high'
            : risk === 'MEDIUM'
              ? 'network-medium'
              : 'network-low';

        return (
          <div
            className="network-risk-row"
            key={`${pair.StoreA}-${pair.StoreB}-${index}`}
          >

            <div className="network-pair">

              <span className="network-index">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="network-stores">

                <strong>
                  {pair.StoreA}
                </strong>

                <span>↔</span>

                <strong>
                  {pair.StoreB}
                </strong>

              </div>

            </div>


            <div className="network-overlap">

              <div className="network-overlap-top">
                <span>Visitor Overlap</span>

                <strong>
                  {overlap.toFixed(1)}%
                </strong>
              </div>

              <div className="network-track">

                <div
                  className={`network-fill ${riskClass}`}
                  style={{
                    width: `${Math.min(
                      overlap,
                      100
                    )}%`
                  }}
                />

              </div>

            </div>


            <div className={`network-risk-badge ${riskClass}`}>
              {risk}
            </div>

          </div>
        );
      })}

    </div>

    <div className="network-footer">

      <span>
        Higher visitor overlap indicates stronger spatial
        interaction between store catchments.
      </span>

      <strong>
  {visitorOverlap.length} pairs analyzed
</strong>

    </div>

  </div>

</div>
</section>

    </div>
  )
}

export default App