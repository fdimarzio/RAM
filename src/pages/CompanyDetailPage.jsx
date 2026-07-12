import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import QuickAddForm from '../components/QuickAddForm.jsx'
import { buildTimeline } from '../lib/timeline.js'
import './DetailPage.css'

function CompanyDetailPage({ companyId, onBack, onNavigate }) {
  const [company, setCompany] = useState(null)
  const [people, setPeople] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [cases, setCases] = useState([])
  const [allCases, setAllCases] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeAddForm, setActiveAddForm] = useState(null)
  const [newCaseName, setNewCaseName] = useState('')

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
      { data: allCaseData },
      { data: noteData }
    ] = await Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).single(),
      supabase.from('people').select('*').eq('company_id', companyId).order('full_name'),
      supabase.from('opportunities').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('company_id', companyId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('events').select('*').eq('company_id', companyId).order('event_date', { ascending: false }),
      supabase.from('case_companies').select('case_id, cases(*)').eq('company_id', companyId),
      supabase.from('cases').select('id, name').order('name'),
      supabase.from('notes').select('id, body, created_at').eq('entity_type', 'company').eq('entity_id', companyId)
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
    setNotes(noteData || [])
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

  async function handleCreateNewCase(e) {
    e.preventDefault()
    if (!newCaseName.trim()) return
    const { data: createdCase, error: createError } = await supabase
      .from('cases')
      .insert({ name: newCaseName.trim() })
      .select('id')
      .single()

    if (createError) {
      setError(createError.message)
      return
    }

    const { error: linkError } = await supabase
      .from('case_companies')
      .insert({ company_id: companyId, case_id: createdCase.id })

    if (linkError) {
      setError(linkError.message)
      return
    }

    setNewCaseName('')
    setActiveAddForm(null)
    loadAll()
  }

  if (loading) return <p className="muted-text">Loading company...</p>
  if (error && !company) return <div className="error-banner">{error}</div>
  if (!company) return <p className="muted-text">Company not found.</p>

  const linkedCaseIds = new Set(cases.map((c) => c.id))
  const unlinkedCases = allCases.filter((c) => !linkedCaseIds.has(c.id))

  const timeline = buildTimeline({ events, notes, opportunities, tasks })

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
                <button className="link-button" onClick={() => onNavigate('people', p.id)}>
                  {p.full_name}
                </button>{' '}
                {p.title && <span className="muted-text">— {p.title}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <h3>Opportunities ({opportunities.length})</h3>
          {activeAddForm !== 'opportunity' && (
            <button className="link-button" onClick={() => setActiveAddForm('opportunity')}>
              + New Opportunity
            </button>
          )}
        </div>
        {activeAddForm === 'opportunity' && (
          <QuickAddForm
            entityType="opportunity"
            linkField="company_id"
            linkValue={companyId}
            onDone={() => {
              setActiveAddForm(null)
              loadAll()
            }}
            onCancel={() => setActiveAddForm(null)}
          />
        )}
        {opportunities.length === 0 ? (
          <p className="muted-text">No opportunities linked yet.</p>
        ) : (
          <ul className="simple-list">
            {opportunities.map((o) => (
              <li key={o.id}>
                <button className="link-button" onClick={() => onNavigate('opportunities', o.id)}>
                  {o.name}
                </button>{' '}
                <span className="muted-text">— {o.stage?.replace('_', ' ')}, {o.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <h3>Tasks ({tasks.length})</h3>
          {activeAddForm !== 'task' && (
            <button className="link-button" onClick={() => setActiveAddForm('task')}>
              + New Task
            </button>
          )}
        </div>
        {activeAddForm === 'task' && (
          <QuickAddForm
            entityType="task"
            linkField="company_id"
            linkValue={companyId}
            onDone={() => {
              setActiveAddForm(null)
              loadAll()
            }}
            onCancel={() => setActiveAddForm(null)}
          />
        )}
        {tasks.length === 0 ? (
          <p className="muted-text">No tasks linked yet.</p>
        ) : (
          <ul className="simple-list">
            {tasks.map((t) => (
              <li key={t.id}>
                <button className="link-button" onClick={() => onNavigate('tasks', t.id)}>
                  {t.name}
                </button>{' '}
                <span className="muted-text">— due {t.due_date || 'no date'}, {t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <h3>Events ({events.length})</h3>
          {activeAddForm !== 'event' && (
            <button className="link-button" onClick={() => setActiveAddForm('event')}>
              + New Event
            </button>
          )}
        </div>
        {activeAddForm === 'event' && (
          <QuickAddForm
            entityType="event"
            linkField="company_id"
            linkValue={companyId}
            onDone={() => {
              setActiveAddForm(null)
              loadAll()
            }}
            onCancel={() => setActiveAddForm(null)}
          />
        )}
        {events.length === 0 ? (
          <p className="muted-text">No events linked yet.</p>
        ) : (
          <ul className="simple-list">
            {events.map((ev) => (
              <li key={ev.id}>
                <button className="link-button" onClick={() => onNavigate('events', ev.id)}>
                  {new Date(ev.event_date).toLocaleDateString()}
                </button>{' '}
                <span className="muted-text">— {ev.event_type || 'meeting'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <div className="detail-section-header">
          <h3>Cases ({cases.length})</h3>
          {activeAddForm !== 'case' && (
            <button className="link-button" onClick={() => setActiveAddForm('case')}>
              + New Case
            </button>
          )}
        </div>
        {activeAddForm === 'case' && (
          <form className="quick-add-form" onSubmit={handleCreateNewCase}>
            <div className="form-grid">
              <label className="full-width">
                Name *
                <input
                  required
                  value={newCaseName}
                  onChange={(e) => setNewCaseName(e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setActiveAddForm(null)
                  setNewCaseName('')
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save
              </button>
            </div>
          </form>
        )}
        {cases.length === 0 ? (
          <p className="muted-text">No cases linked yet.</p>
        ) : (
          <ul className="simple-list">
            {cases.map((c) => (
              <li key={c.id}>
                <button className="link-button" onClick={() => onNavigate('cases', c.id)}>
                  {c.name}
                </button>{' '}
                <span className="muted-text">— {c.status}</span>{' '}
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
        <h3>Timeline ({timeline.length})</h3>
        {timeline.length === 0 ? (
          <p className="muted-text">No timeline activity yet.</p>
        ) : (
          <ul className="timeline-list">
            {timeline.map((item, index) => (
              <li key={`${item.kind}-${item.entityId || index}`} className="timeline-item">
                <span className="timeline-date">{new Date(item.date).toLocaleDateString()}</span>
                <span className={`timeline-kind timeline-kind-${item.kind}`}>{item.kind}</span>
                {item.entityType && item.entityId ? (
                  <button
                    className="link-button"
                    onClick={() => onNavigate(item.entityType, item.entityId)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span>{item.label}</span>
                )}
              </li>
            ))}
          </ul>
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
