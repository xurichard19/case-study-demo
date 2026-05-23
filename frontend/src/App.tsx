import { useEffect, useState } from 'react'
import './App.css'
import ClientLogin from './ClientLogin'
import ClientPortal from './ClientPortal'
import Dashboard from './Dashboard'
import DispatcherLogin from './DispatcherLogin'
import Home from './Home'

type View =
  | 'home'
  | 'dispatcher-login'
  | 'client-login'
  | 'dispatcher-dashboard'
  | 'dispatcher-past-orders'
  | 'client-portal'

const viewPaths: Record<View, string> = {
  home: '/',
  'dispatcher-login': '/dispatcher/login',
  'client-login': '/client/login',
  'dispatcher-dashboard': '/dispatcher/current-orders',
  'dispatcher-past-orders': '/dispatcher/past-orders',
  'client-portal': '/client/orders',
}

function getViewFromPath(pathname: string): View {
  if (pathname === '/dispatcher/dashboard') {
    return 'dispatcher-dashboard'
  }

  const matchedView = Object.entries(viewPaths).find(([, path]) => path === pathname)

  return matchedView ? (matchedView[0] as View) : 'home'
}

function App() {
  const [view, setView] = useState<View>(() => getViewFromPath(window.location.pathname))

  function navigate(nextView: View) {
    setView(nextView)
    window.history.pushState({}, '', viewPaths[nextView])
  }

  useEffect(() => {
    function handlePopState() {
      setView(getViewFromPath(window.location.pathname))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (view === 'dispatcher-dashboard') {
    return (
      <Dashboard
        mode="current"
        onLogout={() => navigate('home')}
        onSelectCurrent={() => navigate('dispatcher-dashboard')}
        onSelectPast={() => navigate('dispatcher-past-orders')}
      />
    )
  }

  if (view === 'dispatcher-past-orders') {
    return (
      <Dashboard
        mode="past"
        onLogout={() => navigate('home')}
        onSelectCurrent={() => navigate('dispatcher-dashboard')}
        onSelectPast={() => navigate('dispatcher-past-orders')}
      />
    )
  }

  if (view === 'dispatcher-login') {
    return (
      <DispatcherLogin
        onBackHome={() => navigate('home')}
        onLogin={() => navigate('dispatcher-dashboard')}
        onSelectClient={() => navigate('client-login')}
      />
    )
  }

  if (view === 'client-login') {
    return (
      <ClientLogin
        onBackHome={() => navigate('home')}
        onLogin={() => navigate('client-portal')}
        onSelectDispatcher={() => navigate('dispatcher-login')}
      />
    )
  }

  if (view === 'client-portal') {
    return <ClientPortal onLogout={() => navigate('home')} />
  }

  return (
    <Home
      onSelectClient={() => navigate('client-login')}
      onSelectDispatcher={() => navigate('dispatcher-login')}
    />
  )
}

export default App
