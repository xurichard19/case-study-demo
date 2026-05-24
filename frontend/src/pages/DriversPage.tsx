import { useEffect, useMemo, useState } from 'react'
import DispatcherNav from '../components/DispatcherNav'
import { getDriverMetrics, type DriverMetrics } from '../services/api'

type DriversPageProps = {
  onLogout: () => void
  onSelectHome: () => void
  onSelectCurrent: () => void
  onSelectPast: () => void
  onSelectWeeklyReport: () => void
}

function formatRate(value: number) {
  return `${Math.round(value * 100)}%`
}

function DriversPage({
  onLogout,
  onSelectHome,
  onSelectCurrent,
  onSelectPast,
  onSelectWeeklyReport,
}: DriversPageProps) {
  const [drivers, setDrivers] = useState<DriverMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDrivers() {
      try {
        setIsLoading(true)
        setDrivers(await getDriverMetrics())
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load drivers')
      } finally {
        setIsLoading(false)
      }
    }

    loadDrivers()
  }, [])

  const currentlyDelivering = useMemo(
    () => drivers.filter((driver) => driver.current_order_count > 0),
    [drivers],
  )
  const notAvailable = useMemo(
    () => drivers.filter((driver) => !driver.active || driver.unacceptable_metrics),
    [drivers],
  )

  function renderDriverTable(tableDrivers: DriverMetrics[]) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Status</th>
              <th>Current orders</th>
              <th>Total orders</th>
              <th>Exception rate</th>
              <th>Tardiness rate</th>
            </tr>
          </thead>
          <tbody>
            {tableDrivers.map((driver) => (
              <tr className={driver.unacceptable_metrics ? 'metric-alert-row' : undefined} key={driver.id}>
                <td>
                  <strong>{driver.display_name ?? driver.id}</strong>
                  <span>{driver.id}</span>
                </td>
                <td>
                  <span className={`status-pill ${driver.unacceptable_metrics ? 'delayed' : 'on-time'}`}>
                    {driver.status}
                  </span>
                </td>
                <td>{driver.current_order_count}</td>
                <td>{driver.total_orders}</td>
                <td>
                  <strong className={driver.exception_rate >= 0.5 ? 'metric-alert' : undefined}>
                    {formatRate(driver.exception_rate)}
                  </strong>
                  <span>{driver.exception_count} exceptions</span>
                </td>
                <td>
                  <strong className={driver.tardiness_rate >= 0.25 ? 'metric-alert' : undefined}>
                    {formatRate(driver.tardiness_rate)}
                  </strong>
                  <span>{driver.tardy_count} late orders</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <main className="dashboard-page">
      <DispatcherNav
        activePage="drivers"
        onLogout={onLogout}
        onSelectCurrent={onSelectCurrent}
        onSelectDrivers={() => undefined}
        onSelectHome={onSelectHome}
        onSelectPast={onSelectPast}
        onSelectWeeklyReport={onSelectWeeklyReport}
      />

      <section className="dashboard-header" aria-labelledby="drivers-title">
        <div>
          <p className="eyebrow">Demo date: Mar 31, 2025</p>
          <h1 id="drivers-title">Drivers</h1>
          <p>
            Driver availability and performance metrics for exception rate and tardiness.
          </p>
        </div>
        <div className="summary-grid" aria-label="Driver summary">
          <article>
            <span>{drivers.length}</span>
            <p>Total drivers</p>
          </article>
          <article>
            <span>{currentlyDelivering.length}</span>
            <p>Delivering</p>
          </article>
          <article>
            <span>{notAvailable.length}</span>
            <p>Not available</p>
          </article>
        </div>
      </section>

      <section className="orders-section" aria-labelledby="driver-tables-title">
        <div className="section-heading">
          <div>
            <h2 id="driver-tables-title">Driver status</h2>
            <p>Metrics highlighted in red exceed operational thresholds.</p>
          </div>
        </div>

        {isLoading && <p className="state-message">Loading driver metrics...</p>}
        {error && <p className="state-message error-message">{error}</p>}

        {!isLoading && !error && (
          <div className="order-table-stack">
            <section className="split-orders-section" aria-labelledby="drivers-delivering-title">
              <div className="section-heading compact-heading">
                <div>
                  <h3 id="drivers-delivering-title">Currently delivering</h3>
                  <p>{currentlyDelivering.length} drivers have current orders on or after Mar 31</p>
                </div>
              </div>
              {currentlyDelivering.length > 0 ? (
                renderDriverTable(currentlyDelivering)
              ) : (
                <p className="state-message">No drivers are currently delivering orders.</p>
              )}
            </section>

            <section className="split-orders-section" aria-labelledby="drivers-unavailable-title">
              <div className="section-heading compact-heading">
                <div>
                  <h3 id="drivers-unavailable-title">Not available</h3>
                  <p>{notAvailable.length} drivers are inactive or have unacceptable metrics</p>
                </div>
              </div>
              {notAvailable.length > 0 ? (
                renderDriverTable(notAvailable)
              ) : (
                <p className="state-message">No drivers are currently flagged as unavailable.</p>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

export default DriversPage
