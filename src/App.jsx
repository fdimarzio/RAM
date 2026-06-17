import { useState } from 'react'
import CompaniesPage from './pages/CompaniesPage.jsx'
import PeoplePage from './pages/PeoplePage.jsx'
import './styles/App.css'

const VIEWS = ['dashboard', 'people', 'companies', 'opportunities', 'events', 'tasks', 'cases']

function App() {
  const [view, setView] = useState('companies')

  return (
    <div className="app">
      <header className="app-header">
        <h1>RAM</h1>
        <p className="app-subtitle">Relationship Agentic Management</p>
      </header>
      <nav className="app-nav">
        {VIEWS.map((item) => (
          <button
            key={item}
            className={view === item ? 'nav-button active' : 'nav-button'}
            onClick={() => setView(item)}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {view === 'companies' && <CompaniesPage />}
        {view === 'people' && <PeoplePage />}
        {!['companies', 'people'].includes(view) && (
          <p className="placeholder-note">
            {view.charAt(0).toUpperCase() + view.slice(1)} view coming soon.
          </p>
        )}
      </main>
    </div>
  )
}

export default App
