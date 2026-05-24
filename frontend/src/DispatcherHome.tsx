import { useEffect, useMemo, useState } from 'react'
import { getDailyReport, type DailyReport } from './api'

type DispatcherHomeProps = {
  onLogout: () => void
  onSelectCurrent: () => void
  onSelectPast: () => void
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function DispatcherHome({ onLogout, onSelectCurrent, onSelectPast }: DispatcherHomeProps) {
  const [report, setReport] = useState<DailyReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    async function loadReport() {
      try {
        setIsLoading(true)
        setReport(await getDailyReport())
        setError(null)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load daily report')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [])

  const currentWeather = report?.weather.current
  const incidentCount = report?.traffic.incidents?.length ?? 0
  const trafficLabel = useMemo(() => {
    if (!report) return 'Loading'
    if (report.traffic.available === false) return 'Unavailable'
    if (incidentCount === 0) return 'Clear'
    return `${incidentCount} incidents`
  }, [incidentCount, report])

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
                <button type="button">Daily briefing</button>
                <button type="button" onClick={onSelectCurrent}>Current orders</button>
                <button type="button" onClick={onSelectPast}>Past orders</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="dashboard-header" aria-labelledby="briefing-title">
        <div>
          <p className="eyebrow">Boston daily briefing</p>
          <h1 id="briefing-title">Weather and traffic report</h1>
          <p>
            Generated once each morning after 5:00 AM Boston time and held until the next report.
          </p>
        </div>
        <div className="summary-grid" aria-label="Briefing summary">
          <article>
            <span>{currentWeather?.temperature_2m ?? '--'}°</span>
            <p>Temperature</p>
          </article>
          <article>
            <span>{currentWeather?.wind_speed_10m ?? '--'} mph</span>
            <p>Wind</p>
          </article>
          <article>
            <span>{trafficLabel}</span>
            <p>Traffic</p>
          </article>
        </div>
      </section>

      <section className="briefing-section" aria-labelledby="daily-briefing">
        <div className="section-heading">
          <div>
            <h2 id="daily-briefing">Daily briefing</h2>
            <p>{report ? `${report.location} · ${formatDate(report.generated_at)}` : 'Loading report'}</p>
          </div>
        </div>

        {isLoading && <p className="state-message">Loading Boston conditions...</p>}
        {error && <p className="state-message error-message">{error}</p>}

        {!isLoading && !error && report && (
          <div className="briefing-layout">
            <article className="briefing-panel briefing-summary">
              <h3>GPT summary</h3>
              <p>{report.summary}</p>
            </article>
            <article className="briefing-panel">
              <h3>Weather</h3>
              <dl>
                <div>
                  <dt>Precipitation</dt>
                  <dd>{currentWeather?.precipitation ?? '--'} in</dd>
                </div>
                <div>
                  <dt>Wind gusts</dt>
                  <dd>{currentWeather?.wind_gusts_10m ?? '--'} mph</dd>
                </div>
              </dl>
            </article>
            <article className="briefing-panel">
              <h3>Traffic</h3>
              <dl>
                <div>
                  <dt>Provider</dt>
                  <dd>{report.traffic.provider ?? 'Unknown'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{report.traffic.message ?? trafficLabel}</dd>
                </div>
              </dl>
            </article>
          </div>
        )}
      </section>
    </main>
  )
}

export default DispatcherHome
