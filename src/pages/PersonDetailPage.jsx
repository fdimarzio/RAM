import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

function PersonDetailPage({ personId, onBack }) {
  const [person, setPerson] = useState(null)
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
      { data: personData, error: personError },
      { data: oppData },
      { data: taskData },
      { data: eventLinkData },
      { data: caseLinkData },
      { data: allCaseData }
    ] = await Promise.all([
      supabase.from('people').select('*, companies(name)').eq('id', personId).single(),
      supabase.from('opportunities').select('*').eq('person_id', personId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('person_id', personId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('event_participants').select('event_id, events(*)').eq('person_id', personId),
      supabase.from('case_people').select('case_id, cases(*)').eq('person_id', personId),
      supabase.from('cases').select('id, name').order('name')
    ])

    if (personError) {
      setError(personError.message)
    } else {
      setPerson(personData)
    }
    setOpportunities(oppData || [])
    setTasks(taskData || [])
    setEvents((eventLinkData || []).map((row) => row.events).filter(Boolean))
    setCases((caseLinkData || []).map((row) => row.cases).filter(Boolean))
    setAllCases(allCaseData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  async function handleLinkCase(caseId) {
    if (!caseId) return
    const { error: linkError } = await supabase
      .from('case_people')
      .insert({ person_id: personId, case_id: caseId })
    if (linkError) {
      setError(linkError.message)
    } else {
      loadAll()
    }
  }

  async function handleUnlinkCase(caseId) {
    const { error: unlinkError } = await supabase
      .from('case_people')
      .delete()
      .eq('person_id', personId)
      .eq('case_id', caseId)
    if (unlinkError) {
      setError(unlinkError.message)
    } else {
      loadAll()
    }
  }

  if (loading) return <p className="muted-text">Loading person...</p>
  if (error && !person) return <div className="error-banner">{error}</div>
  if (!person) return <p className="muted-text">Person not found.</p>

  const linkedCaseIds = new Set(cases.map((c) => c.id))
  const unlinkedCases = allCases.filter((c) => !linkedCaseIds.has(c.id))

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to People
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{person.full_name}</h2>
        <span className={`status-badge status-${person.relationship_status}`}>
          {person.relationship_status}
        </span>
      </div>

      <div className="detail-summary-grid">
        <div>
          <strong>Title</strong>
          <p>{person.title || '—'}</p>
        </div>
        <div>
          <strong>Company</strong>
          <p>{person.companies?.name || '—'}</p>
        </div>
        <div>
          <strong>Email</strong>
          <p>{person.email || '—'}</p>
        </div>
        <div>
          <strong>Phone</strong>
          <p>{person.phone || '—'}</p>
        </div>
        <div>
          <strong>Relationship Type</strong>
          <p>{person.relationship_type || '—'}</p>
        </div>
      </div>
      {person.personal_notes && (
        <div className="detail-block">
          <strong>Personal Notes</strong>
          <p>{person.personal_notes}</p>
        </div>
      )}

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
        <NotesPanel entityType="person" entityId={person.id} />
      </section>
    </div>
  )
}

export default PersonDetailPage
