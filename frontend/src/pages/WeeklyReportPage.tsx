import { useEffect, useState } from 'react'
import MarkdownText from '../components/MarkdownText'
import { getWeeklyReport, type MetricRow, type WeeklyReport } from '../services/api'

type WeeklyReportPageProps = {
  onLogout: () => void
  onSelectHome: () => void
  onSelectCurrent: () => void
  onSelectDrivers: () => void
  onSelectPast: () => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatRate(value: number) {
  return `${Math.round(value * 100)}%`
}

function MetricTable({ rows }: { rows: MetricRow[] }) {
  return (
    <div className="table-wrap compact-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Orders</th>
            <th>On time</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 8).map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.total_orders}</td>
              <td>{row.on_time_orders}</td>
              <td>
                <strong className={row.on_time_rate < 0.8 ? 'metric-alert' : undefined}>
                  {formatRate(row.on_time_rate)}
                </strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WeeklyReportPage({
  onLogout,
  onSelectHome,
  onSelectCurrent,
  onSelectDrivers,
  onSelectPast,
}: WeeklyReportPageProps) {
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    async function loadReport() {
      try {
        setIsLoading(true)
        setReport(await getWeeklyReport())
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load weekly report')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [])

  return (
    <main className="dashboard-page">
      <nav className="top-nav dashboard-nav" aria-label="Dispatcher navigation">
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
              <div className="menu-popover" aria-label="Dispatcher pages">
                <button type="button" onClick={onSelectHome}>Daily briefing</button>
                <button type="button" onClick={onSelectCurrent}>Current orders</button>
                <button type="button" onClick={onSelectPast}>Past orders</button>
                <button type="button" onClick={onSelectDrivers}>Drivers</button>
                <button type="button">Weekly report</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="dashboard-header" aria-labelledby="weekly-report-title">
        <div>
          <p className="eyebrow">Demo date: Mar 31, 2025</p>
          <h1 id="weekly-report-title">Weekly report</h1>
          <p>
            Previous business week metrics for on-time performance, redeliveries, and exceptions.
          </p>
        </div>
        <div className="summary-grid" aria-label="Weekly metric summary">
          <article>
            <span>{report?.total_orders ?? '--'}</span>
            <p>Total orders</p>
          </article>
          <article>
            <span>{report ? formatRate(report.redelivery_rate) : '--'}</span>
            <p>Redelivery rate</p>
          </article>
          <article>
            <span>{report?.exception_volume ?? '--'}</span>
            <p>Exceptions</p>
          </article>
        </div>
      </section>

      <section className="orders-section" aria-labelledby="weekly-details-title">
        <div className="section-heading">
          <div>
            <h2 id="weekly-details-title">Previous business week</h2>
            <p>
              {report
                ? `${formatDate(report.week_start)} - ${formatDate(report.week_end)}`
                : 'Loading metrics'}
            </p>
          </div>
        </div>

        {isLoading && <p className="state-message">Loading weekly report...</p>}
        {error && <p className="state-message error-message">{error}</p>}

        {!isLoading && !error && report && (
          <div className="weekly-report-layout">
            <article className="briefing-panel briefing-summary weekly-summary">
              <h3>GPT summary</h3>
              <MarkdownText text={report.summary} />
            </article>
            <article className="briefing-panel">
              <h3>On-time rate by service</h3>
              <MetricTable rows={report.on_time_by_service} />
            </article>
            <article className="briefing-panel">
              <h3>On-time rate by client</h3>
              <MetricTable rows={report.on_time_by_client} />
            </article>
            <article className="briefing-panel">
              <h3>On-time rate by driver</h3>
              <MetricTable rows={report.on_time_by_driver} />
            </article>
          </div>
        )}
      </section>
    </main>
  )
}

export default WeeklyReportPage
