import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import Home from './Home'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (isAuthenticated) {
    return <Dashboard onLogout={() => setIsAuthenticated(false)} />
  }

  return <Home onLogin={() => setIsAuthenticated(true)} />
}

export default App
