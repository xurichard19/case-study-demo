import { useEffect, useMemo, useState } from 'react'
import { getClients, getDrivers, getOrders, type ApiOrder, type ClientAccount, type Driver } from './api'

const DEMO_DATE = new Date('2025-03-31T00:00:00')
const DEMO_DATE_PARAM = DEMO_DATE.toISOString()
const DEMO_DATE_LABEL = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(DEMO_DATE)
const PAST_PAGE_SIZE = 100

type DashboardProps = {
  mode: 'current' | 'past'
  onLogout: () => void
  onSelectHome: () => void
  onSelectCurrent: () => void
  onSelectPast: () => void
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

const severityLabels = {
  'severity one': 'Severity one',
  'severity two': 'Severity two',
  'severity three': 'Severity three',
}

const severityScores = {
  'severity one': 100,
  'severity two': 50,
  'severity three': 0,
}

const severityRanks = {
  'severity one': 3,
  'severity two': 2,
  'severity three': 1,
}

function priorityScore(order: ApiOrder) {
  const label = statusLabel(order)
  const service = order.service_type?.toLowerCase() ?? ''

  let score = 0
  score += severityScores[order.severity]
  if (label === 'Unassigned') score += 100
  if (label === 'Delayed') score += 80
  if (label === 'At risk') score += 50
  if (service.includes('stat')) score += 25
  if (service.includes('rush')) score += 18
  if (order.redelivery_flag) score += 30

  return score
}

function sortCurrentOrders(orders: ApiOrder[]) {
  return [...orders].sort((first, second) => {
    const severityDifference = severityRanks[second.severity] - severityRanks[first.severity]

    if (severityDifference !== 0) {
      return severityDifference
    }

    const priorityDifference = priorityScore(second) - priorityScore(first)

    if (priorityDifference !== 0) {
      return priorityDifference
    }

    return new Date(second.order_time ?? 0).getTime() - new Date(first.order_time ?? 0).getTime()
  })
}

function Dashboard({ mode, onLogout, onSelectHome, onSelectCurrent, onSelectPast }: DashboardProps) {
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [pastPage, setPastPage] = useState(0)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true)
        const [ordersData, clientsData, driversData] = await Promise.all([
          getOrders({
            beforeTime: mode === 'past' ? DEMO_DATE_PARAM : undefined,
            fromTime: mode === 'current' ? DEMO_DATE_PARAM : undefined,
            limit: mode === 'past' ? PAST_PAGE_SIZE : 1000,
            offset: mode === 'past' ? pastPage * PAST_PAGE_SIZE : 0,
          }),
          getClients(),
          getDrivers(),
        ])
        setOrders(mode === 'current' ? sortCurrentOrders(ordersData) : ordersData)
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
  }, [mode, pastPage])

  const atRiskCount = useMemo(
    () => orders.filter((order) => statusLabel(order) === 'At risk').length,
    [orders],
  )
  const unassignedCount = useMemo(
    () => orders.filter((order) => statusLabel(order) === 'Unassigned').length,
    [orders],
  )
  const title = mode === 'current' ? 'Current orders' : 'Past orders'
  const hasNextPastPage = mode === 'past' && orders.length === PAST_PAGE_SIZE

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
          <div className="dashboard-menu">
            <button
              type="button"
              className="menu-button"
              aria-expanded={isMenuOpen}
              aria-label="Open menu"
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
            {isMenuOpen && (
              <div className="menu-popover" aria-label="Dispatcher pages">
                <button type="button" onClick={onSelectHome}>
                  Daily briefing
                </button>
                <button type="button" onClick={onSelectCurrent}>
                  Current orders
                </button>
                <button type="button" onClick={onSelectPast}>
                  Past orders
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="dashboard-header" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Demo date: {DEMO_DATE_LABEL}</p>
          <h1 id="dashboard-title">{title}</h1>
          <p>
            {mode === 'current'
              ? 'Orders on or after the demo date, ranked by dispatch priority.'
              : 'Orders before the demo date, sorted by order time.'}
          </p>
        </div>
        <div className="summary-grid" aria-label="Order summary">
          <article>
            <span>{orders.length}</span>
            <p>{mode === 'past' ? 'This page' : 'Current orders'}</p>
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
          <div>
            <h2 id="orders-title">{title}</h2>
            <p>
              {clients.length} clients · {drivers.length} drivers
            </p>
          </div>
          {mode === 'past' && (
            <div className="pagination-controls" aria-label="Past orders pagination">
              <button type="button" disabled={pastPage === 0} onClick={() => setPastPage((page) => page - 1)}>
                Previous
              </button>
              <span>Page {pastPage + 1}</span>
              <button type="button" disabled={!hasNextPastPage} onClick={() => setPastPage((page) => page + 1)}>
                Next
              </button>
            </div>
          )}
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
                        <strong className={`severity ${order.severity.replace(' ', '-')}`}>
                          {severityLabels[order.severity]}
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
