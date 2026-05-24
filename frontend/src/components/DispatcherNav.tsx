import { useState } from 'react'

type DispatcherNavPage = 'daily' | 'current' | 'past' | 'drivers' | 'weekly'

type DispatcherNavProps = {
  activePage: DispatcherNavPage
  onLogout: () => void
  onSelectCurrent: () => void
  onSelectDrivers: () => void
  onSelectHome: () => void
  onSelectPast: () => void
  onSelectWeeklyReport: () => void
}

function DispatcherNav({
  activePage,
  onLogout,
  onSelectCurrent,
  onSelectDrivers,
  onSelectHome,
  onSelectPast,
  onSelectWeeklyReport,
}: DispatcherNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const pages = [
    { id: 'daily', label: 'Daily briefing', onSelect: onSelectHome },
    { id: 'current', label: 'Current orders', onSelect: onSelectCurrent },
    { id: 'past', label: 'Past orders', onSelect: onSelectPast },
    { id: 'drivers', label: 'Drivers', onSelect: onSelectDrivers },
    { id: 'weekly', label: 'Weekly report', onSelect: onSelectWeeklyReport },
  ] as const

  return (
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
              {pages.map((page) => (
                <button
                  type="button"
                  key={page.id}
                  onClick={page.id === activePage ? undefined : page.onSelect}
                >
                  {page.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default DispatcherNav
