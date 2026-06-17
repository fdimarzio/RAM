import { useState } from 'react'
import './styles/App.css'

function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div className="app">
      <header className="app-header">
        <h1>RAM</h1>
        <p className="app-subtitle">Relationship Agentic Management</p>
      </header>
      <nav className="app-nav">
        {['dashboard', 'people', 'companies', 'opportunities', 'events', 'tasks', 'cases'].map(
          (item) => (
            <button
              key={item}
              className={view === item ? 'nav-button active' : 'nav-button'}
              onClick={() => setView(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          )
        )}
      </nav>
      <main className="app-main">
        <p>Current view: {view}</p>
        <p className="placeholder-note">
          Scaffold ready — entity views and Supabase wiring go here.
        </p>
      </main>
    </div>
  )
}

export default App
