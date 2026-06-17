import { useState } from 'react'
import CompaniesPage from './pages/CompaniesPage.jsx'
import PeoplePage from './pages/PeoplePage.jsx'
import OpportunitiesPage from './pages/OpportunitiesPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import CasesPage from './pages/CasesPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import CompanyDetailPage from './pages/CompanyDetailPage.jsx'
import PersonDetailPage from './pages/PersonDetailPage.jsx'
import OpportunityDetailPage from './pages/OpportunityDetailPage.jsx'
import TaskDetailPage from './pages/TaskDetailPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import './styles/App.css'

const VIEWS = ['dashboard', 'people', 'companies', 'opportunities', 'events', 'tasks', 'cases']

function App() {
  const [view, setView] = useState('companies')
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)

  function changeView(nextView) {
    setSelectedCompanyId(null)
    setSelectedPersonId(null)
    setSelectedOpportunityId(null)
    setSelectedTaskId(null)
    setSelectedEventId(null)
    setView(nextView)
  }

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
            onClick={() => changeView(item)}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {view === 'companies' &&
          (selectedCompanyId ? (
            <CompanyDetailPage
              companyId={selectedCompanyId}
              onBack={() => setSelectedCompanyId(null)}
            />
          ) : (
            <CompaniesPage onSelectCompany={setSelectedCompanyId} />
          ))}

        {view === 'people' &&
          (selectedPersonId ? (
            <PersonDetailPage
              personId={selectedPersonId}
              onBack={() => setSelectedPersonId(null)}
            />
          ) : (
            <PeoplePage onSelectPerson={setSelectedPersonId} />
          ))}

        {view === 'opportunities' &&
          (selectedOpportunityId ? (
            <OpportunityDetailPage
              opportunityId={selectedOpportunityId}
              onBack={() => setSelectedOpportunityId(null)}
            />
          ) : (
            <OpportunitiesPage onSelectOpportunity={setSelectedOpportunityId} />
          ))}

        {view === 'events' &&
          (selectedEventId ? (
            <EventDetailPage eventId={selectedEventId} onBack={() => setSelectedEventId(null)} />
          ) : (
            <EventsPage onSelectEvent={setSelectedEventId} />
          ))}

        {view === 'tasks' &&
          (selectedTaskId ? (
            <TaskDetailPage taskId={selectedTaskId} onBack={() => setSelectedTaskId(null)} />
          ) : (
            <TasksPage onSelectTask={setSelectedTaskId} />
          ))}

        {view === 'cases' && <CasesPage />}

        {view === 'dashboard' && (
          <p className="placeholder-note">Dashboard view coming soon.</p>
        )}
      </main>
    </div>
  )
}

export default App
