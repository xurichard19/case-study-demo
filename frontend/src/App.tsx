import { useEffect, useState } from 'react'
import './App.css'
import ClientLogin from './ClientLogin'
import ClientPortal from './ClientPortal'
import Dashboard from './Dashboard'
import DispatcherHome from './DispatcherHome'
import DispatcherLogin from './DispatcherLogin'
import DriversPage from './DriversPage'
import Home from './Home'

type View =
  | 'home'
  | 'dispatcher-login'
  | 'client-login'
  | 'dispatcher-home'
  | 'dispatcher-dashboard'
  | 'dispatcher-past-orders'
  | 'dispatcher-drivers'
  | 'client-portal'
  | 'client-past-orders'

const viewPaths: Record<View, string> = {
  home: '/',
  'dispatcher-login': '/dispatcher/login',
  'client-login': '/client/login',
  'dispatcher-home': '/dispatcher',
  'dispatcher-dashboard': '/dispatcher/current-orders',
  'dispatcher-past-orders': '/dispatcher/past-orders',
  'dispatcher-drivers': '/dispatcher/drivers',
  'client-portal': '/client/orders',
  'client-past-orders': '/client/past-orders',
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

  if (view === 'dispatcher-home') {
    return (
      <DispatcherHome
        onLogout={() => navigate('home')}
        onSelectCurrent={() => navigate('dispatcher-dashboard')}
        onSelectDrivers={() => navigate('dispatcher-drivers')}
        onSelectPast={() => navigate('dispatcher-past-orders')}
      />
    )
  }

  if (view === 'dispatcher-drivers') {
    return (
      <DriversPage
        onLogout={() => navigate('home')}
        onSelectHome={() => navigate('dispatcher-home')}
        onSelectCurrent={() => navigate('dispatcher-dashboard')}
        onSelectPast={() => navigate('dispatcher-past-orders')}
      />
    )
  }

  if (view === 'dispatcher-dashboard') {
    return (
      <Dashboard
        mode="current"
        onLogout={() => navigate('home')}
        onSelectHome={() => navigate('dispatcher-home')}
        onSelectCurrent={() => navigate('dispatcher-dashboard')}
        onSelectDrivers={() => navigate('dispatcher-drivers')}
        onSelectPast={() => navigate('dispatcher-past-orders')}
      />
    )
  }

  if (view === 'dispatcher-past-orders') {
    return (
      <Dashboard
        mode="past"
        onLogout={() => navigate('home')}
        onSelectHome={() => navigate('dispatcher-home')}
        onSelectCurrent={() => navigate('dispatcher-dashboard')}
        onSelectDrivers={() => navigate('dispatcher-drivers')}
        onSelectPast={() => navigate('dispatcher-past-orders')}
      />
    )
  }

  if (view === 'dispatcher-login') {
    return (
      <DispatcherLogin
        onBackHome={() => navigate('home')}
        onLogin={() => navigate('dispatcher-home')}
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
    return (
      <ClientPortal
        mode="current"
        onLogout={() => navigate('home')}
        onSelectCurrent={() => navigate('client-portal')}
        onSelectPast={() => navigate('client-past-orders')}
      />
    )
  }

  if (view === 'client-past-orders') {
    return (
      <ClientPortal
        mode="past"
        onLogout={() => navigate('home')}
        onSelectCurrent={() => navigate('client-portal')}
        onSelectPast={() => navigate('client-past-orders')}
      />
    )
  }

  return (
    <Home
      onSelectClient={() => navigate('client-login')}
      onSelectDispatcher={() => navigate('dispatcher-login')}
    />
  )
}

export default App
