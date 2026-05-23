import type { FormEvent } from 'react'

type HomeProps = {
  onLogin: () => void
}

function Home({ onLogin }: HomeProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="home-page">
      <nav className="top-nav" aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="Case Study home">
          <span className="brand-mark" aria-hidden="true">CS</span>
          <span>Dispatch Portal</span>
        </a>
        <div className="nav-actions">
          <a href="#features">Features</a>
          <a href="#support">Support</a>
        </div>
      </nav>

      <section className="login-hero" aria-labelledby="login-title">
        <div className="hero-copy">
          <p className="eyebrow">Operations dashboard</p>
          <h1 id="login-title">Sign in to manage daily dispatch.</h1>
          <p className="hero-text">
            Track driver status, review exceptions, and keep each order moving
            from one clean workspace.
          </p>
        </div>

        <form className="login-card" aria-label="Login form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>Welcome back</h2>
            <p>Use your team account to continue.</p>
          </div>

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="name@company.com" />

          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Password" />

          <div className="form-row">
            <label className="remember">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a href="#support">Forgot password?</a>
          </div>

          <button type="submit">Log in</button>

          <p className="support-note" id="support">
            Need access? Contact your dispatch administrator.
          </p>
        </form>
      </section>

      <section className="feature-strip" id="features" aria-label="Product highlights">
        <article>
          <span className="feature-icon" aria-hidden="true">01</span>
          <h2>Live dispatch</h2>
          <p>Review active routes and driver capacity before issues compound.</p>
        </article>
        <article>
          <span className="feature-icon" aria-hidden="true">02</span>
          <h2>Exception review</h2>
          <p>Surface late orders, missed scans, and priority follow-ups quickly.</p>
        </article>
        <article>
          <span className="feature-icon" aria-hidden="true">03</span>
          <h2>Clean reports</h2>
          <p>Check daily performance trends without leaving the dispatch flow.</p>
        </article>
      </section>
    </main>
  )
}

export default Home
