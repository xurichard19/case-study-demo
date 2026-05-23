type DashboardProps = {
  onLogout: () => void
}

type Order = {
  id: string
  time: string
  client: string
  service: string
  driver: string
  pickup: string
  delivery: string
  promisedEta: string
  status: 'On time' | 'At risk' | 'Delayed' | 'Unassigned'
  exception: string
  severity: 'Low' | 'Medium' | 'High'
}

const orders: Order[] = [
  {
    id: 'ORD-25000',
    time: 'Mar 24, 6:47 AM',
    client: 'Lowell General',
    service: 'Routine',
    driver: 'D035',
    pickup: '02030',
    delivery: '02120',
    promisedEta: '10:46 AM',
    status: 'At risk',
    exception: 'Traffic delay on I-93',
    severity: 'Medium',
  },
  {
    id: 'ORD-25001',
    time: 'Mar 12, 10:28 AM',
    client: "Brigham & Women's",
    service: 'Routine',
    driver: 'D022',
    pickup: '02177',
    delivery: '02101',
    promisedEta: '1:51 PM',
    status: 'On time',
    exception: 'Client callback pending',
    severity: 'Low',
  },
  {
    id: 'ORD-25002',
    time: 'Mar 1, 12:59 PM',
    client: "St. Elizabeth's Medical",
    service: 'Routine',
    driver: 'D024',
    pickup: '02125',
    delivery: '02142',
    promisedEta: '5:13 PM',
    status: 'On time',
    exception: 'None logged',
    severity: 'Low',
  },
  {
    id: 'ORD-25003',
    time: 'Mar 1, 1:23 PM',
    client: 'South Shore Hospital',
    service: 'Routine',
    driver: 'D005',
    pickup: '02066',
    delivery: '02130',
    promisedEta: '6:21 PM',
    status: 'On time',
    exception: 'None logged',
    severity: 'Low',
  },
  {
    id: 'ORD-25004',
    time: 'Feb 12, 5:49 PM',
    client: 'Labcorp Inc',
    service: 'Routine',
    driver: 'D014',
    pickup: '02184',
    delivery: '02105',
    promisedEta: '11:33 PM',
    status: 'At risk',
    exception: 'Hospital parking issue',
    severity: 'Medium',
  },
  {
    id: 'ORD-25005',
    time: 'Feb 4, 3:27 PM',
    client: 'Boston Med Ctr',
    service: 'STAT',
    driver: 'D006',
    pickup: '02103',
    delivery: '02153',
    promisedEta: '4:10 PM',
    status: 'Delayed',
    exception: 'Redelivery needed',
    severity: 'High',
  },
  {
    id: 'ORD-25006',
    time: 'Feb 3, 9:55 PM',
    client: 'BioReference Labs',
    service: 'STAT',
    driver: 'D022',
    pickup: '02143',
    delivery: '02060',
    promisedEta: '10:48 PM',
    status: 'At risk',
    exception: 'Pickup scan missing',
    severity: 'Medium',
  },
  {
    id: 'ORD-25007',
    time: 'Jan 29, 8:12 AM',
    client: 'Mass General',
    service: 'STAT',
    driver: 'Unassigned',
    pickup: '02114',
    delivery: '02139',
    promisedEta: '9:05 AM',
    status: 'Unassigned',
    exception: 'Needs driver match',
    severity: 'High',
  },
]

function Dashboard({ onLogout }: DashboardProps) {
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
            Placeholder operational view for exception triage, status calls,
            reporting, and driver matching.
          </p>
        </div>
        <div className="summary-grid" aria-label="Order summary">
          <article>
            <span>{orders.length}</span>
            <p>Total orders</p>
          </article>
          <article>
            <span>{orders.filter((order) => order.status === 'At risk').length}</span>
            <p>At risk</p>
          </article>
          <article>
            <span>{orders.filter((order) => order.status === 'Unassigned').length}</span>
            <p>Unassigned</p>
          </article>
        </div>
      </section>

      <section className="orders-section" aria-labelledby="orders-title">
        <div className="section-heading">
          <h2 id="orders-title">All orders</h2>
          <p>Static sample rows, ready for backend or CSV wiring later.</p>
        </div>

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
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                    <span>{order.time}</span>
                  </td>
                  <td>{order.client}</td>
                  <td>{order.service}</td>
                  <td>{order.driver}</td>
                  <td>
                    {order.pickup} {'->'} {order.delivery}
                  </td>
                  <td>{order.promisedEta}</td>
                  <td>
                    <span className={`status-pill ${order.status.toLowerCase().replace(' ', '-')}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <strong className={`severity severity-${order.severity.toLowerCase()}`}>
                      {order.severity}
                    </strong>
                    <span>{order.exception}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default Dashboard
