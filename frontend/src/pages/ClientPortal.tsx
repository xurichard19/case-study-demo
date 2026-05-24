import { useEffect, useMemo, useState } from 'react'
import { getClients, getOrders, type ApiOrder, type ClientAccount } from '../services/api'

type ClientPortalProps = {
  mode: 'current' | 'past'
  onLogout: () => void
  onSelectCurrent: () => void
  onSelectPast: () => void
}

const CLIENT_DEMO_DATE_KEY = '2025-03-31'
const CLIENT_DEMO_DATE = new Date(`${CLIENT_DEMO_DATE_KEY}T00:00:00`)
const CLIENT_DEMO_DATE_LABEL = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(CLIENT_DEMO_DATE)

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

function clientStatus(order: ApiOrder) {
  if (order.delivery_time) {
    return 'Delivered'
  }

  if (order.exception_notes || order.on_time === false) {
    return 'Attention needed'
  }

  if (order.pickup_time || order.dispatch_time) {
    return 'In transit'
  }

  return 'Processing'
}

function progressPercent(order: ApiOrder) {
  if (order.delivery_time) return 100
  if (order.pickup_time) return 68
  if (order.dispatch_time || order.driver_id) return 42
  return 16
}

function clientOrderDate(order: ApiOrder) {
  return order.delivery_time ?? order.promised_eta ?? order.order_time
}

function dateKey(value: string | null) {
  return value?.slice(0, 10) ?? null
}

function isCurrentClientOrder(order: ApiOrder) {
  const orderDateKey = dateKey(clientOrderDate(order))
  if (!orderDateKey) {
    return true
  }

  return orderDateKey >= CLIENT_DEMO_DATE_KEY
}

function ClientPortal({ mode, onLogout, onSelectCurrent, onSelectPast }: ClientPortalProps) {
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    async function loadClients() {
      try {
        const clientData = await getClients()
        setClients(clientData)
        setSelectedClientId(clientData[0]?.id ?? '')
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load clients')
        setIsLoading(false)
      }
    }

    loadClients()
  }, [])

  useEffect(() => {
    async function loadOrders() {
      if (!selectedClientId) {
        setOrders([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const clientOrders = await getOrders({
          clientAccountId: selectedClientId,
          limit: 1000,
        })
        setOrders(
          clientOrders.filter((order) =>
            mode === 'current' ? isCurrentClientOrder(order) : !isCurrentClientOrder(order),
          ),
        )
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [mode, selectedClientId])

  const attentionCount = useMemo(
    () => orders.filter((order) => clientStatus(order) === 'Attention needed').length,
    [orders],
  )
  const onScheduleCount = useMemo(
    () => orders.filter((order) => clientStatus(order) !== 'Attention needed').length,
    [orders],
  )
  const title = mode === 'current' ? 'Current order statuses' : 'Past order statuses'

  return (
    <main className="dashboard-page">
      <nav className="top-nav dashboard-nav" aria-label="Client portal navigation">
        <a className="brand" href="/" aria-label="Case Study home">
          <span className="brand-mark" aria-hidden="true">CS</span>
          <span>Dispatch Portal</span>
        </a>
        <div className="dashboard-actions">
          <button type="button" className="logout-button" onClick={onLogout}>
            Log out
          </button>
          <div className="dashboard-menu" onMouseLeave={() => setIsMenuOpen(false)}>
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
              <div className="menu-popover" aria-label="Client pages">
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

      <section className="dashboard-header client-header" aria-labelledby="client-portal-title">
        <div>
          <p className="eyebrow">Client portal · Demo date: {CLIENT_DEMO_DATE_LABEL}</p>
          <h1 id="client-portal-title">{title}</h1>
          <p>
            {mode === 'current'
              ? 'Orders on or after the client demo date, with active status and ETA details.'
              : 'Orders before the client demo date for reviewing previous delivery activity.'}
          </p>
        </div>
        <div className="summary-grid" aria-label="Client order summary">
          <article>
            <span>{orders.length}</span>
            <p>Total visible</p>
          </article>
          <article>
            <span>{attentionCount}</span>
            <p>Needs attention</p>
          </article>
          <article>
            <span>{onScheduleCount}</span>
            <p>On schedule</p>
          </article>
        </div>
      </section>

      <section className="orders-section" aria-labelledby="client-orders-title">
        <div className="section-heading">
          <div>
            <h2 id="client-orders-title">{mode === 'current' ? 'Current orders' : 'Past orders'}</h2>
            <p>Showing a selectable client account until auth scoping is wired.</p>
          </div>
          <select
            className="client-select"
            aria-label="Client account"
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {isLoading && <p className="state-message">Loading client orders...</p>}
        {error && <p className="state-message error-message">{error}</p>}

        {!isLoading && !error && (
          <div className="client-order-grid">
            {orders.map((order) => {
              const status = clientStatus(order)

              return (
                <article className="client-order-card" key={order.id}>
                  <div>
                    <strong>{order.id}</strong>
                    <span>{formatDate(order.order_time)}</span>
                  </div>
                  <span className={`status-pill ${status === 'Attention needed' ? 'at-risk' : 'on-time'}`}>
                    {status}
                  </span>
                  <div className="order-progress" aria-label={`${order.id} progress`}>
                    <div>
                      <span style={{ width: `${progressPercent(order)}%` }} />
                    </div>
                    <p>{progressPercent(order)}% complete</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Service</dt>
                      <dd>{order.service_type ?? 'Unknown'}</dd>
                    </div>
                    <div>
                      <dt>Route</dt>
                      <dd>
                        {order.pickup_zip ?? '----'} {'->'} {order.delivery_zip ?? '----'}
                      </dd>
                    </div>
                    <div>
                      <dt>ETA</dt>
                      <dd>{formatDate(order.promised_eta)}</dd>
                    </div>
                  </dl>
                  <p>{order.exception_notes ?? 'No current exceptions reported.'}</p>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default ClientPortal
