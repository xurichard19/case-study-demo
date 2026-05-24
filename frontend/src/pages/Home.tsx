import { useState } from 'react'

type HomeProps = {
  onSelectClient: () => void
  onSelectDispatcher: () => void
}

function Home({ onSelectClient, onSelectDispatcher }: HomeProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <main className="home-page">
      <nav className="top-nav" aria-label="Primary navigation">
        <button type="button" className="brand brand-button" onClick={() => setIsMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">CS</span>
          <span>Dispatch Portal</span>
        </button>
        <div className="home-menu" onMouseLeave={() => setIsMenuOpen(false)}>
          <button
            type="button"
            className="menu-button"
            aria-expanded={isMenuOpen}
            aria-label="Open login menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          {isMenuOpen && (
            <div className="menu-popover" aria-label="Login options">
              <button type="button" onClick={onSelectClient}>
                Client login
              </button>
              <button type="button" onClick={onSelectDispatcher}>
                Dispatcher login
              </button>
            </div>
          )}
        </div>
      </nav>

      <section className="landing-hero" aria-labelledby="home-title">
        <p className="eyebrow">Healthcare logistics</p>
        <h1 id="home-title">Order visibility for dispatch teams and clients.</h1>
        <p>
          A lightweight portal for managing daily medical deliveries, checking
          status updates, and keeping the right people in the right view.
        </p>
        <div className="landing-actions">
          <button type="button" onClick={onSelectClient}>
            Client portal
          </button>
          <button type="button" className="secondary-button" onClick={onSelectDispatcher}>
            Dispatcher login
          </button>
        </div>
      </section>

      <section className="feature-strip" aria-label="Portal highlights">
        <article>
          <span className="feature-icon" aria-hidden="true">01</span>
          <h2>Separate access</h2>
          <p>Dispatchers and clients start from different login paths.</p>
        </article>
        <article>
          <span className="feature-icon" aria-hidden="true">02</span>
          <h2>Order status</h2>
          <p>Clients get a focused view of their active and recent orders.</p>
        </article>
        <article>
          <span className="feature-icon" aria-hidden="true">03</span>
          <h2>Dispatch control</h2>
          <p>Internal operations stay reserved for dispatcher users.</p>
        </article>
      </section>
    </main>
  )
}

export default Home
