import type { FormEvent } from 'react'
import { useState } from 'react'

type ClientLoginProps = {
  onBackHome: () => void
  onLogin: () => void
  onSelectDispatcher: () => void
}

function ClientLogin({ onBackHome, onLogin, onSelectDispatcher }: ClientLoginProps) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onLogin()
  }

  return (
    <main className="home-page">
      <nav className="top-nav" aria-label="Client login navigation">
        <button type="button" className="brand brand-button" onClick={onBackHome}>
          <span className="brand-mark" aria-hidden="true">CS</span>
          <span>Dispatch Portal</span>
        </button>
        <div className="nav-actions">
          <button type="button" onClick={onSelectDispatcher}>
            Dispatcher login
          </button>
        </div>
      </nav>

      <section className="login-hero" aria-labelledby="client-login-title">
        <div className="hero-copy">
          <p className="eyebrow">Client access</p>
          <h1 id="client-login-title">Track your active medical deliveries.</h1>
          <p className="hero-text">
            Client accounts get a focused status view for their organization
            without exposing dispatcher-only operations.
          </p>
        </div>

        <form className="login-card" aria-label="Client login form" onSubmit={handleSubmit}>
          <div className="form-heading">
            <h2>{isCreatingAccount ? 'Create client account' : 'Client login'}</h2>
            <p>
              {isCreatingAccount
                ? 'Set up a client portal account for your organization.'
                : 'Use your client account to view order statuses.'}
            </p>
          </div>

          {isCreatingAccount && (
            <>
              <label htmlFor="client-organization">Organization</label>
              <input
                id="client-organization"
                name="organization"
                type="text"
                placeholder="Hospital or lab name"
              />
            </>
          )}

          <label htmlFor="client-email">Email</label>
          <input id="client-email" name="email" type="email" placeholder="name@organization.com" />

          <label htmlFor="client-password">Password</label>
          <input id="client-password" name="password" type="password" placeholder="Password" />

          {isCreatingAccount && (
            <>
              <label htmlFor="client-confirm-password">Confirm password</label>
              <input
                id="client-confirm-password"
                name="confirm-password"
                type="password"
                placeholder="Confirm password"
              />
            </>
          )}

          <button type="submit">{isCreatingAccount ? 'Create account' : 'Log in'}</button>

          <p className="support-note">
            {isCreatingAccount ? 'Already have an account?' : 'Need a client account?'}{' '}
            <button
              type="button"
              className="text-button"
              onClick={() => setIsCreatingAccount((creating) => !creating)}
            >
              {isCreatingAccount ? 'Log in' : 'Create one'}
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}

export default ClientLogin
