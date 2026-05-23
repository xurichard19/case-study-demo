import { useEffect, useMemo, useState } from 'react'
import { getClients, getOrders, type ApiOrder, type ClientAccount } from './api'

type ClientPortalProps = {
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

function ClientPortal({ onLogout }: ClientPortalProps) {
  const [clients, setClients] = useState<ClientAccount[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setOrders(await getOrders({ clientAccountId: selectedClientId }))
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [selectedClientId])

  const attentionCount = useMemo(
    () => orders.filter((order) => clientStatus(order) === 'Attention needed').length,
    [orders],
  )
  const onScheduleCount = useMemo(
    () => orders.filter((order) => clientStatus(order) !== 'Attention needed').length,
    [orders],
  )

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
          <button type="button" className="menu-button" aria-label="Open menu">
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <section className="dashboard-header client-header" aria-labelledby="client-portal-title">
        <div>
          <p className="eyebrow">Client portal</p>
          <h1 id="client-portal-title">Your order statuses</h1>
          <p>
            A client-only view for checking active deliveries, recent updates,
            and current ETA details.
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
            <h2 id="client-orders-title">Visible orders</h2>
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
