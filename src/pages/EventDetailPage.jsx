import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

function toLocalDatetimeInputValue(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function EventDetailPage({ eventId, onBack, onNavigate }) {
  const [event, setEvent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState([])
  const [people, setPeople] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [lookupsLoaded, setLookupsLoaded] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: eventData, error: eventError },
      { data: taskData }
    ] = await Promise.all([
      supabase
        .from('events')
        .select(
          '*, companies(id, name), opportunities(id, name), event_participants(person_id, people(id, full_name))'
        )
        .eq('id', eventId)
        .single(),
      supabase.from('tasks').select('*').eq('event_id', eventId).order('due_date', { ascending: true, nullsFirst: false })
    ])

    if (eventError) {
      setError(eventError.message)
    } else {
      setEvent(eventData)
    }
    setTasks(taskData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function loadLookups() {
    const [{ data: companyData }, { data: peopleData }, { data: oppData }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('people').select('id, full_name').order('full_name'),
      supabase.from('opportunities').select('id, name').order('name')
    ])
    setCompanies(companyData || [])
    setPeople(peopleData || [])
    setOpportunities(oppData || [])
    setLookupsLoaded(true)
  }

  async function openEdit() {
    if (!lookupsLoaded) await loadLookups()
    setEditForm({
      event_type: event.event_type || '',
      event_date: toLocalDatetimeInputValue(event.event_date),
      company_id: event.company_id || '',
      opportunity_id: event.opportunity_id || '',
      meeting_notes: event.meeting_notes || '',
      discussion_topics: event.discussion_topics || '',
      commitments_made: event.commitments_made || '',
      action_items: event.action_items || '',
      follow_up_required: !!event.follow_up_required,
      participant_ids: (event.event_participants || []).map((ep) => ep.person_id)
    })
    setEditing(true)
  }

  function toggleParticipant(personId) {
    setEditForm((prev) => {
      const exists = prev.participant_ids.includes(personId)
      return {
        ...prev,
        participant_ids: exists
          ? prev.participant_ids.filter((id) => id !== personId)
          : [...prev.participant_ids, personId]
      }
    })
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      event_type: editForm.event_type || null,
      event_date: editForm.event_date ? new Date(editForm.event_date).toISOString() : null,
      company_id: editForm.company_id || null,
      opportunity_id: editForm.opportunity_id || null,
      meeting_notes: editForm.meeting_notes || null,
      discussion_topics: editForm.discussion_topics || null,
      commitments_made: editForm.commitments_made || null,
      action_items: editForm.action_items || null,
      follow_up_required: !!editForm.follow_up_required
    }

    const { error: updateError } = await supabase.from('events').update(payload).eq('id', eventId)
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    await supabase.from('event_participants').delete().eq('event_id', eventId)
    if (editForm.participant_ids.length > 0) {
      const rows = editForm.participant_ids.map((personId) => ({
        event_id: eventId,
        person_id: personId
      }))
      const { error: participantError } = await supabase.from('event_participants').insert(rows)
      if (participantError) {
        setError(participantError.message)
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setEditing(false)
    loadAll()
  }

  if (loading) return <p className="muted-text">Loading event...</p>
  if (error && !event) return <div className="error-banner">{error}</div>
  if (!event) return <p className="muted-text">Event not found.</p>

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Events
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{event.event_type || 'Event'}</h2>
        <span className="status-badge status-active">
          {new Date(event.event_date).toLocaleString()}
        </span>
        {!editing && (
          <button className="link-button" onClick={openEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form className="entity-form" onSubmit={handleEditSubmit}>
          <h3>Edit Event</h3>
          <div className="form-grid">
            <label>
              Type
              <input
                placeholder="e.g. Meeting, Call, Conference"
                value={editForm.event_type}
                onChange={(e) => setEditForm({ ...editForm, event_type: e.target.value })}
              />
            </label>
            <label>
              Date &amp; Time *
              <input
                required
                type="datetime-local"
                value={editForm.event_date}
                onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
              />
            </label>
            <label>
              Company
              <select
                value={editForm.company_id}
                onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
              >
                <option value="">— None —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Opportunity
              <select
                value={editForm.opportunity_id}
                onChange={(e) => setEditForm({ ...editForm, opportunity_id: e.target.value })}
              >
                <option value="">— None —</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Participants
              <div className="checkbox-list">
                {people.map((p) => (
                  <label key={p.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editForm.participant_ids.includes(p.id)}
                      onChange={() => toggleParticipant(p.id)}
                    />
                    {p.full_name}
                  </label>
                ))}
                {people.length === 0 && <span className="muted-text">No people to select yet.</span>}
              </div>
            </label>
            <label className="full-width">
              Discussion Topics
              <textarea
                rows={2}
                value={editForm.discussion_topics}
                onChange={(e) => setEditForm({ ...editForm, discussion_topics: e.target.value })}
              />
            </label>
            <label className="full-width">
              Meeting Notes
              <textarea
                rows={2}
                value={editForm.meeting_notes}
                onChange={(e) => setEditForm({ ...editForm, meeting_notes: e.target.value })}
              />
            </label>
            <label className="full-width">
              Commitments Made
              <textarea
                rows={2}
                value={editForm.commitments_made}
                onChange={(e) => setEditForm({ ...editForm, commitments_made: e.target.value })}
              />
            </label>
            <label className="full-width">
              Action Items
              <textarea
                rows={2}
                value={editForm.action_items}
                onChange={(e) => setEditForm({ ...editForm, action_items: e.target.value })}
              />
            </label>
            <label className="checkbox-item full-width">
              <input
                type="checkbox"
                checked={editForm.follow_up_required}
                onChange={(e) => setEditForm({ ...editForm, follow_up_required: e.target.checked })}
              />
              Follow-up required
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="detail-summary-grid">
            <div>
              <strong>Company</strong>
              <p>
                {event.companies?.id ? (
                  <button
                    className="link-button"
                    onClick={() => onNavigate('companies', event.companies.id)}
                  >
                    {event.companies.name}
                  </button>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <strong>Opportunity</strong>
              <p>
                {event.opportunities?.id ? (
                  <button
                    className="link-button"
                    onClick={() => onNavigate('opportunities', event.opportunities.id)}
                  >
                    {event.opportunities.name}
                  </button>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <strong>Follow-up Required</strong>
              <p>{event.follow_up_required ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div className="detail-block">
            <strong>Participants</strong>
            <p>
              {(event.event_participants || []).length === 0
                ? '—'
                : event.event_participants.map((ep, idx) => (
                    <span key={ep.person_id}>
                      {ep.people?.id ? (
                        <button
                          className="link-button"
                          onClick={() => onNavigate('people', ep.people.id)}
                        >
                          {ep.people.full_name}
                        </button>
                      ) : (
                        ep.people?.full_name
                      )}
                      {idx < event.event_participants.length - 1 ? ', ' : ''}
                    </span>
                  ))}
            </p>
          </div>

          {event.discussion_topics && (
            <div className="detail-block">
              <strong>Discussion Topics</strong>
              <p>{event.discussion_topics}</p>
            </div>
          )}
          {event.meeting_notes && (
            <div className="detail-block">
              <strong>Meeting Notes</strong>
              <p>{event.meeting_notes}</p>
            </div>
          )}
          {event.commitments_made && (
            <div className="detail-block">
              <strong>Commitments Made</strong>
              <p>{event.commitments_made}</p>
            </div>
          )}
          {event.action_items && (
            <div className="detail-block">
              <strong>Action Items</strong>
              <p>{event.action_items}</p>
            </div>
          )}
        </>
      )}

      <section className="detail-section">
        <h3>Tasks ({tasks.length})</h3>
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
        <h3>Notes</h3>
        <NotesPanel entityType="event" entityId={event.id} />
      </section>
    </div>
  )
}

export default EventDetailPage
