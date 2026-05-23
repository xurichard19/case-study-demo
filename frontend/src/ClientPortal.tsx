type ClientPortalProps = {
  onLogout: () => void
}

const clientOrders = [
  {
    id: 'ORD-25001',
    requested: 'Mar 12, 10:28 AM',
    service: 'Routine',
    route: '02177 -> 02101',
    eta: '1:51 PM',
    status: 'In transit',
    note: 'Driver assigned, delivery on schedule.',
  },
  {
    id: 'ORD-25004',
    requested: 'Feb 12, 5:49 PM',
    service: 'Routine',
    route: '02184 -> 02105',
    eta: '11:33 PM',
    status: 'Attention needed',
    note: 'Parking delay reported near destination.',
  },
  {
    id: 'ORD-25005',
    requested: 'Feb 4, 3:27 PM',
    service: 'STAT',
    route: '02103 -> 02153',
    eta: '4:10 PM',
    status: 'Delivered',
    note: 'Delivery completed; redelivery review pending.',
  },
]

function ClientPortal({ onLogout }: ClientPortalProps) {
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
            <span>{clientOrders.length}</span>
            <p>Total visible</p>
          </article>
          <article>
            <span>1</span>
            <p>Needs attention</p>
          </article>
          <article>
            <span>2</span>
            <p>On schedule</p>
          </article>
        </div>
      </section>

      <section className="orders-section" aria-labelledby="client-orders-title">
        <div className="section-heading">
          <h2 id="client-orders-title">Visible orders</h2>
          <p>Static placeholder rows until client-scoped auth/data is wired.</p>
        </div>

        <div className="client-order-grid">
          {clientOrders.map((order) => (
            <article className="client-order-card" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <span>{order.requested}</span>
              </div>
              <span
                className={`status-pill ${
                  order.status === 'Attention needed' ? 'at-risk' : 'on-time'
                }`}
              >
                {order.status}
              </span>
              <dl>
                <div>
                  <dt>Service</dt>
                  <dd>{order.service}</dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>{order.route}</dd>
                </div>
                <div>
                  <dt>ETA</dt>
                  <dd>{order.eta}</dd>
                </div>
              </dl>
              <p>{order.note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default ClientPortal
