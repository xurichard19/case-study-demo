import { useEffect, useMemo, useState } from 'react'
import { getClients, getDrivers, getOrders, type ApiOrder, type ClientAccount, type Driver } from './api'

type DashboardProps = {
  onLogout: () => void
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not set'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusLabel(order: ApiOrder) {
  if (!order.driver_id) {
    return 'Unassigned'
  }

  if (order.status === 'delayed' || order.on_time === false) {
    return 'Delayed'
  }

  if (order.exception_notes) {
    return 'At risk'
  }

  return 'On time'
}

function severity(order: ApiOrder) {
  const notes = order.exception_notes?.toLowerCase() ?? ''

  if (order.redelivery_flag || notes.includes('redelivery') || order.status === 'delayed') {
    return 'High'
  }

  if (notes) {
    return 'Medium'
  }

  return 'Low'
}

function Dashboard({ onLogout }: DashboardProps) {
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true)
        const [ordersData, clientsData, driversData] = await Promise.all([
          getOrders(),
          getClients(),
          getDrivers(),
        ])
        setOrders(ordersData)
        setClients(clientsData)
        setDrivers(driversData)
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const atRiskCount = useMemo(
    () => orders.filter((order) => statusLabel(order) === 'At risk').length,
    [orders],
  )
  const unassignedCount = useMemo(
    () => orders.filter((order) => statusLabel(order) === 'Unassigned').length,
    [orders],
  )

  return (
    <main className="dashboard-page">
      <nav className="top-nav dashboard-nav" aria-label="Dashboard navigation">
        <a className="brand" href="/" aria-label="Case Study home">
          <span className="brand-mark" aria-hidden="true">CS</span>
          <span>Dispatch Portal</span>
        </a>
        <div className="dashboard-actions">
          <button type="button" className="logout-button" onClick={onLogout}>
            Log out
          </button>
          <button type="button" className="menu-button" aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <section className="dashboard-header" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Dispatch control</p>
          <h1 id="dashboard-title">Orders dashboard</h1>
          <p>
            Live operational view for exception triage, status calls, reporting,
            and driver matching.
          </p>
        </div>
        <div className="summary-grid" aria-label="Order summary">
          <article>
            <span>{orders.length}</span>
            <p>Total orders</p>
          </article>
          <article>
            <span>{atRiskCount}</span>
            <p>At risk</p>
          </article>
          <article>
            <span>{unassignedCount}</span>
            <p>Unassigned</p>
          </article>
        </div>
      </section>

      <section className="orders-section" aria-labelledby="orders-title">
        <div className="section-heading">
          <h2 id="orders-title">All orders</h2>
          <p>
            {clients.length} clients · {drivers.length} drivers
          </p>
        </div>

        {isLoading && <p className="state-message">Loading dispatch data...</p>}
        {error && <p className="state-message error-message">{error}</p>}

        {!isLoading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th>Exception</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const orderStatus = statusLabel(order)
                  const orderSeverity = severity(order)

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.id}</strong>
                        <span>{formatDate(order.order_time)}</span>
                      </td>
                      <td>{order.client_name}</td>
                      <td>{order.service_type ?? 'Unknown'}</td>
                      <td>{order.driver_id ?? 'Unassigned'}</td>
                      <td>
                        {order.pickup_zip ?? '----'} {'->'} {order.delivery_zip ?? '----'}
                      </td>
                      <td>{formatDate(order.promised_eta)}</td>
                      <td>
                        <span className={`status-pill ${orderStatus.toLowerCase().replace(' ', '-')}`}>
                          {orderStatus}
                        </span>
                      </td>
                      <td>
                        <strong className={`severity severity-${orderSeverity.toLowerCase()}`}>
                          {orderSeverity}
                        </strong>
                        <span>{order.exception_notes ?? 'None logged'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default Dashboard
