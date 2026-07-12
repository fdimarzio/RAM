import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import QuickAddForm from '../components/QuickAddForm.jsx'
import { buildTimeline } from '../lib/timeline.js'
import './DetailPage.css'

function PersonDetailPage({ personId, onBack, onNavigate }) {
  const [person, setPerson] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [cases, setCases] = useState([])
  const [allCases, setAllCases] = useState([])
  const [relatedPeople, setRelatedPeople] = useState([])
  const [allPeople, setAllPeople] = useState([])
  const [newRelatedPersonId, setNewRelatedPersonId] = useState('')
  const [newRelationType, setNewRelationType] = useState('')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeAddForm, setActiveAddForm] = useState(null)
  const [newCaseName, setNewCaseName] = useState('')

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: personData, error: personError },
      { data: oppData },
      { data: taskData },
      { data: eventLinkData },
      { data: caseLinkData },
      { data: allCaseData },
      { data: relatedPeopleData },
      { data: allPeopleData },
      { data: noteData }
    ] = await Promise.all([
      supabase
        .from('people')
        .select('*, companies(name), reporting_manager:reporting_manager_id(id, full_name)')
        .eq('id', personId)
        .single(),
      supabase.from('opportunities').select('*').eq('person_id', personId).order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('person_id', personId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('event_participants').select('event_id, events(*)').eq('person_id', personId),
      supabase.from('case_people').select('case_id, cases(*)').eq('person_id', personId),
      supabase.from('cases').select('id, name').order('name'),
      supabase
        .from('person_relationships')
        .select('related_person_id, relationship_type, people:related_person_id(id, full_name, title)')
        .eq('person_id', personId),
      supabase.from('people').select('id, full_name').order('full_name'),
      supabase.from('notes').select('id, body, created_at').eq('entity_type', 'person').eq('entity_id', personId)
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
    setRelatedPeople(
      (relatedPeopleData || [])
        .map((row) => (row.people ? { ...row.people, relationship_type: row.relationship_type } : null))
        .filter(Boolean)
    )
    setAllPeople((allPeopleData || []).filter((p) => p.id !== personId))
    setNotes(noteData || [])
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
      .from('case_people')
      .insert({ person_id: personId, case_id: createdCase.id })

    if (linkError) {
      setError(linkError.message)
      return
    }

    setNewCaseName('')
    setActiveAddForm(null)
    loadAll()
  }

  async function handleEventCreated(newEventId) {
    if (newEventId) {
      await supabase.from('event_participants').insert({ event_id: newEventId, person_id: personId })
    }
    setActiveAddForm(null)
    loadAll()
  }

  async function handleLinkRelatedPerson(e) {
    e.preventDefault()
    if (!newRelatedPersonId) return
    const { error: linkError } = await supabase.from('person_relationships').insert({
      person_id: personId,
      related_person_id: newRelatedPersonId,
      relationship_type: newRelationType.trim() || null
    })
    if (linkError) {
      setError(linkError.message)
    } else {
      setNewRelatedPersonId('')
      setNewRelationType('')
      loadAll()
    }
  }

  async function handleUnlinkRelatedPerson(relatedPersonId) {
    const { error: unlinkError } = await supabase
      .from('person_relationships')
      .delete()
      .eq('person_id', personId)
      .eq('related_person_id', relatedPersonId)
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

  const linkedRelatedIds = new Set(relatedPeople.map((p) => p.id))
  const unlinkedRelatedPeople = allPeople.filter((p) => !linkedRelatedIds.has(p.id))

  const timeline = buildTimeline({ events, notes, opportunities, tasks })

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
          <strong>First Name</strong>
          <p>{person.first_name || '—'}</p>
        </div>
        <div>
          <strong>Middle Name</strong>
          <p>{person.middle_name || '—'}</p>
        </div>
        <div>
          <strong>Last Name</strong>
          <p>{person.last_name || '—'}</p>
        </div>
        <div>
          <strong>Title</strong>
          <p>{person.title || '—'}</p>
        </div>
        <div>
          <strong>Company</strong>
          <p>
            {person.company_id ? (
              <button className="link-button" onClick={() => onNavigate('companies', person.company_id)}>
                {person.companies?.name || '—'}
              </button>
            ) : (
              person.companies?.name || '—'
            )}
          </p>
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
        {person.reporting_manager_id && (
          <div>
            <strong>Manager</strong>
            <p>
              <button
                className="link-button"
                onClick={() => onNavigate('people', person.reporting_manager_id)}
              >
                {person.reporting_manager?.full_name || '—'}
              </button>
            </p>
          </div>
        )}
      </div>
      {person.personal_notes && (
        <div className="detail-block">
          <strong>Personal Notes</strong>
          <p>{person.personal_notes}</p>
        </div>
      )}

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
            linkField="person_id"
            linkValue={personId}
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
            linkField="person_id"
            linkValue={personId}
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
            linkField={null}
            linkValue={null}
            onDone={handleEventCreated}
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
        <h3>Related People ({relatedPeople.length})</h3>
        {relatedPeople.length === 0 ? (
          <p className="muted-text">No related people yet.</p>
        ) : (
          <ul className="simple-list">
            {relatedPeople.map((p) => (
              <li key={p.id}>
                <button className="link-button" onClick={() => onNavigate('people', p.id)}>
                  {p.full_name}
                </button>{' '}
                <span className="muted-text">— {p.relationship_type || 'related'}</span>{' '}
                <button
                  className="link-button danger"
                  onClick={() => handleUnlinkRelatedPerson(p.id)}
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        {unlinkedRelatedPeople.length > 0 && (
          <form className="quick-add-form" onSubmit={handleLinkRelatedPerson}>
            <div className="form-grid">
              <label>
                Person
                <select
                  value={newRelatedPersonId}
                  onChange={(e) => setNewRelatedPersonId(e.target.value)}
                >
                  <option value="">Select a person...</option>
                  {unlinkedRelatedPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Relationship Type
                <input
                  placeholder="e.g. colleague, mentor, referred by"
                  value={newRelationType}
                  onChange={(e) => setNewRelationType(e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={!newRelatedPersonId}>
                + Link Person
              </button>
            </div>
          </form>
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
        <NotesPanel entityType="person" entityId={person.id} />
      </section>
    </div>
  )
}

export default PersonDetailPage
