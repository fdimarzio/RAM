import { useState } from 'react'
import { useAuth } from './lib/AuthContext.jsx'
import { supabase } from './lib/supabaseClient'
import LoginPage from './pages/LoginPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import PeoplePage from './pages/PeoplePage.jsx'
import OpportunitiesPage from './pages/OpportunitiesPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import CasesPage from './pages/CasesPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import ProductsServicesPage from './pages/ProductsServicesPage.jsx'
import CompanyDetailPage from './pages/CompanyDetailPage.jsx'
import PersonDetailPage from './pages/PersonDetailPage.jsx'
import OpportunityDetailPage from './pages/OpportunityDetailPage.jsx'
import TaskDetailPage from './pages/TaskDetailPage.jsx'
import EventDetailPage from './pages/EventDetailPage.jsx'
import CaseDetailPage from './pages/CaseDetailPage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import './styles/App.css'

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard' },
  { id: 'companies',     label: 'Companies' },
  { id: 'people',        label: 'People' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'events',        label: 'Events & Meetings' },
  { id: 'tasks',         label: 'Tasks' },
  { id: 'cases',         label: 'Cases' },
  { id: 'products',      label: 'Products & Services' },
]

function App() {
  const { session, user, loading } = useAuth()
  const [view, setView] = useState('companies')
  const [selectedCompanyId, setSelectedCompanyId] = useState(null)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null)

  function changeView(nextView) {
    setSelectedCompanyId(null)
    setSelectedPersonId(null)
    setSelectedOpportunityId(null)
    setSelectedTaskId(null)
    setSelectedEventId(null)
    setSelectedCaseId(null)
    setSelectedProductId(null)
    setView(nextView)
  }

  function navigate(entityType, entityId) {
    setSelectedCompanyId(null)
    setSelectedPersonId(null)
    setSelectedOpportunityId(null)
    setSelectedTaskId(null)
    setSelectedEventId(null)
    setSelectedCaseId(null)
    setSelectedProductId(null)
    setView(entityType)
    if (entityType === 'companies') setSelectedCompanyId(entityId)
    if (entityType === 'people') setSelectedPersonId(entityId)
    if (entityType === 'opportunities') setSelectedOpportunityId(entityId)
    if (entityType === 'tasks') setSelectedTaskId(entityId)
    if (entityType === 'events') setSelectedEventId(entityId)
    if (entityType === 'cases') setSelectedCaseId(entityId)
    if (entityType === 'products') setSelectedProductId(entityId)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <p className="placeholder-note">Loading...</p>
  }

  if (!session) {
    return <LoginPage />
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>RAM</h1>
          <p>Relationship Agentic Management</p>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => changeView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-user-email" title={user?.email}>{user?.email}</p>
          <button className="signout-button" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="app-main">
        {view === 'companies' &&
          (selectedCompanyId ? (
            <CompanyDetailPage
              companyId={selectedCompanyId}
              onBack={() => setSelectedCompanyId(null)}
              onNavigate={navigate}
            />
          ) : (
            <CompaniesPage onSelectCompany={setSelectedCompanyId} />
          ))}

        {view === 'people' &&
          (selectedPersonId ? (
            <PersonDetailPage
              personId={selectedPersonId}
              onBack={() => setSelectedPersonId(null)}
              onNavigate={navigate}
            />
          ) : (
            <PeoplePage onSelectPerson={setSelectedPersonId} />
          ))}

        {view === 'opportunities' &&
          (selectedOpportunityId ? (
            <OpportunityDetailPage
              opportunityId={selectedOpportunityId}
              onBack={() => setSelectedOpportunityId(null)}
              onNavigate={navigate}
            />
          ) : (
            <OpportunitiesPage onSelectOpportunity={setSelectedOpportunityId} />
          ))}

        {view === 'events' &&
          (selectedEventId ? (
            <EventDetailPage
              eventId={selectedEventId}
              onBack={() => setSelectedEventId(null)}
              onNavigate={navigate}
            />
          ) : (
            <EventsPage onSelectEvent={setSelectedEventId} />
          ))}

        {view === 'tasks' &&
          (selectedTaskId ? (
            <TaskDetailPage
              taskId={selectedTaskId}
              onBack={() => setSelectedTaskId(null)}
              onNavigate={navigate}
            />
          ) : (
            <TasksPage onSelectTask={setSelectedTaskId} />
          ))}

        {view === 'cases' &&
          (selectedCaseId ? (
            <CaseDetailPage
              caseId={selectedCaseId}
              onBack={() => setSelectedCaseId(null)}
              onNavigate={navigate}
            />
          ) : (
            <CasesPage onSelectCase={setSelectedCaseId} />
          ))}

        {view === 'products' &&
          (selectedProductId ? (
            <ProductDetailPage
              productId={selectedProductId}
              onBack={() => setSelectedProductId(null)}
              onNavigate={navigate}
            />
          ) : (
            <ProductsServicesPage onSelectProduct={setSelectedProductId} />
          ))}

        {view === 'dashboard' && <DashboardPage onNavigate={navigate} />}
      </main>
    </div>
  )

}

export default App
