import type { FormEvent } from 'react'

type DispatcherLoginProps = {
  onBackHome: () => void
  onLogin: () => void
  onSelectClient: () => void
}

function DispatcherLogin({ onBackHome, onLogin, onSelectClient }: DispatcherLoginProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="home-page">
      <nav className="top-nav" aria-label="Dispatcher login navigation">
        <button type="button" className="brand brand-button" onClick={onBackHome}>
          <span className="brand-mark" aria-hidden="true">CS</span>
          <span>Dispatch Portal</span>
        </button>
        <div className="nav-actions">
          <button type="button" onClick={onSelectClient}>
            Client login
          </button>
        </div>
      </nav>

      <section className="login-hero" aria-labelledby="dispatcher-login-title">
        <div className="hero-copy">
          <p className="eyebrow">Dispatcher access</p>
          <h1 id="dispatcher-login-title">Sign in to manage daily dispatch.</h1>
          <p className="hero-text">
            Internal dispatcher accounts can review all orders, exceptions,
            drivers, and reporting workflows.
          </p>
        </div>

        <form className="login-card" aria-label="Dispatcher login form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>Dispatcher login</h2>
            <p>Use your operations account to continue.</p>
          </div>

          <label htmlFor="dispatcher-email">Email</label>
          <input
            id="dispatcher-email"
            name="email"
            type="email"
            placeholder="dispatcher@company.com"
          />

          <label htmlFor="dispatcher-password">Password</label>
          <input
            id="dispatcher-password"
            name="password"
            type="password"
            placeholder="Password"
          />

          <div className="form-row">
            <label className="remember">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>
            <a href="#support">Forgot password?</a>
          </div>

          <button type="submit">Log in</button>

          <p className="support-note" id="support">
            Dispatcher access will be role-gated when auth is wired.
          </p>
        </form>
      </section>
    </main>
  )
}

export default DispatcherLogin
