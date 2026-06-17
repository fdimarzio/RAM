import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

function CompanyDetailPage({ companyId, onBack }) {
  const [company, setCompany] = useState(null)
  const [people, setPeople] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [cases, setCases] = useState([])
  const [allCases, setAllCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: companyData, error: companyError },
      { data: peopleData },
      { data: oppData },
      { data: taskData },
      { data: eventData },
      { data: caseLinkData },
      { data: allCaseData }
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('people').select('*').eq('company_id', companyId).order('full_name'),
      supabase.from('opportunities').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('company_id', companyId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('events').select('*').eq('company_id', companyId).order('event_date', { ascending: false }),
      supabase.from('case_companies').select('case_id, cases(*)').eq('company_id', companyId),
      supabase.from('cases').select('id, name').order('name')
    ])

    if (companyError) {
      setError(companyError.message)
    } else {
      setCompany(companyData)
    }
    setPeople(peopleData || [])
    setOpportunities(oppData || [])
    setTasks(taskData || [])
    setEvents(eventData || [])
    setCases((caseLinkData || []).map((row) => row.cases).filter(Boolean))
    setAllCases(allCaseData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  async function handleLinkCase(caseId) {
    if (!caseId) return
    const { error: linkError } = await supabase
      .from('case_companies')
      .insert({ company_id: companyId, case_id: caseId })
    if (linkError) {
      setError(linkError.message)
    } else {
      loadAll()
    }
  }

  async function handleUnlinkCase(caseId) {
    const { error: unlinkError } = await supabase
      .from('case_companies')
      .delete()
      .eq('company_id', companyId)
      .eq('case_id', caseId)
    if (unlinkError) {
      setError(unlinkError.message)
    } else {
      loadAll()
    }
  }

  if (loading) return <p className="muted-text">Loading company...</p>
  if (error && !company) return <div className="error-banner">{error}</div>
  if (!company) return <p className="muted-text">Company not found.</p>

  const linkedCaseIds = new Set(cases.map((c) => c.id))
  const unlinkedCases = allCases.filter((c) => !linkedCaseIds.has(c.id))

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Companies
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{company.name}</h2>
        <span className={`status-badge status-${company.status}`}>{company.status}</span>
      </div>

      <div className="detail-summary-grid">
        <div>
          <strong>Industry</strong>
          <p>{company.industry || '—'}</p>
        </div>
        <div>
          <strong>Website</strong>
          <p>{company.website || '—'}</p>
        </div>
        <div>
          <strong>Address</strong>
          <p>{company.address || '—'}</p>
        </div>
      </div>
      {company.description && (
        <div className="detail-block">
          <strong>Description</strong>
          <p>{company.description}</p>
        </div>
      )}

      <section className="detail-section">
        <h3>People ({people.length})</h3>
        {people.length === 0 ? (
          <p className="muted-text">No people linked to this company yet.</p>
        ) : (
          <ul className="simple-list">
            {people.map((p) => (
              <li key={p.id}>
                {p.full_name} {p.title && <span className="muted-text">— {p.title}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Opportunities ({opportunities.length})</h3>
        {opportunities.length === 0 ? (
          <p className="muted-text">No opportunities linked yet.</p>
        ) : (
          <ul className="simple-list">
            {opportunities.map((o) => (
              <li key={o.id}>
                {o.name} <span className="muted-text">— {o.stage?.replace('_', ' ')}, {o.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="muted-text">No tasks linked yet.</p>
        ) : (
          <ul className="simple-list">
            {tasks.map((t) => (
              <li key={t.id}>
                {t.name} <span className="muted-text">— due {t.due_date || 'no date'}, {t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Events ({events.length})</h3>
        {events.length === 0 ? (
          <p className="muted-text">No events linked yet.</p>
        ) : (
          <ul className="simple-list">
            {events.map((ev) => (
              <li key={ev.id}>
                {new Date(ev.event_date).toLocaleDateString()}{' '}
                <span className="muted-text">— {ev.event_type || 'meeting'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Cases ({cases.length})</h3>
        {cases.length === 0 ? (
          <p className="muted-text">No cases linked yet.</p>
        ) : (
          <ul className="simple-list">
            {cases.map((c) => (
              <li key={c.id}>
                {c.name} <span className="muted-text">— {c.status}</span>{' '}
                <button className="link-button danger" onClick={() => handleUnlinkCase(c.id)}>
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        {unlinkedCases.length > 0 && (
          <select defaultValue="" onChange={(e) => handleLinkCase(e.target.value)}>
            <option value="">+ Link existing case...</option>
            {unlinkedCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="detail-section">
        <h3>Notes</h3>
        <NotesPanel entityType="company" entityId={company.id} />
      </section>
    </div>
  )
}

export default CompanyDetailPage
