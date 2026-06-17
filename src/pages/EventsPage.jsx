import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  event_type: '',
  event_date: '',
  company_id: '',
  opportunity_id: '',
  meeting_notes: '',
  discussion_topics: '',
  commitments_made: '',
  action_items: '',
  follow_up_required: false,
  participant_ids: []
}

function toLocalDatetimeInputValue(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function EventsPage({ onSelectEvent }) {
  const [events, setEvents] = useState([])
  const [companies, setCompanies] = useState([])
  const [people, setPeople] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadEvents() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('*, companies(name), opportunities(name), event_participants(person_id, people(full_name))')
      .order('event_date', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  async function loadLookups() {
    const [{ data: companyData }, { data: peopleData }, { data: oppData }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('people').select('id, full_name').order('full_name'),
      supabase.from('opportunities').select('id, name').order('name')
    ])
    setCompanies(companyData || [])
    setPeople(peopleData || [])
    setOpportunities(oppData || [])
  }

  useEffect(() => {
    loadEvents()
    loadLookups()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(event) {
    setForm({
      ...event,
      event_date: toLocalDatetimeInputValue(event.event_date),
      company_id: event.company_id || '',
      opportunity_id: event.opportunity_id || '',
      participant_ids: (event.event_participants || []).map((ep) => ep.person_id)
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  function toggleParticipant(personId) {
    setForm((prev) => {
      const exists = prev.participant_ids.includes(personId)
      return {
        ...prev,
        participant_ids: exists
          ? prev.participant_ids.filter((id) => id !== personId)
          : [...prev.participant_ids, personId]
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      event_type: form.event_type || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      company_id: form.company_id || null,
      opportunity_id: form.opportunity_id || null,
      meeting_notes: form.meeting_notes || null,
      discussion_topics: form.discussion_topics || null,
      commitments_made: form.commitments_made || null,
      action_items: form.action_items || null,
      follow_up_required: !!form.follow_up_required
    }

    let eventId = form.id
    let submitError

    if (form.id) {
      const { error: updateError } = await supabase.from('events').update(payload).eq('id', form.id)
      submitError = updateError
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('events')
        .insert(payload)
        .select('id')
        .single()
      submitError = insertError
      eventId = inserted?.id
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    // Sync participants: clear existing links, then re-insert current selection
    if (eventId) {
      await supabase.from('event_participants').delete().eq('event_id', eventId)
      if (form.participant_ids.length > 0) {
        const rows = form.participant_ids.map((personId) => ({
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
    }

    setSaving(false)
    closeForm()
    loadEvents()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('events').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadEvents()
    }
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>Events &amp; Meetings</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Event
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Event' : 'New Event'}</h3>
          <div className="form-grid">
            <label>
              Type
              <input
                placeholder="e.g. Meeting, Call, Conference"
                value={form.event_type || ''}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              />
            </label>
            <label>
              Date &amp; Time *
              <input
                required
                type="datetime-local"
                value={form.event_date || ''}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </label>
            <label>
              Company
              <select
                value={form.company_id || ''}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
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
                value={form.opportunity_id || ''}
                onChange={(e) => setForm({ ...form, opportunity_id: e.target.value })}
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
                      checked={form.participant_ids.includes(p.id)}
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
                value={form.discussion_topics || ''}
                onChange={(e) => setForm({ ...form, discussion_topics: e.target.value })}
              />
            </label>
            <label className="full-width">
              Meeting Notes
              <textarea
                rows={2}
                value={form.meeting_notes || ''}
                onChange={(e) => setForm({ ...form, meeting_notes: e.target.value })}
              />
            </label>
            <label className="full-width">
              Commitments Made
              <textarea
                rows={2}
                value={form.commitments_made || ''}
                onChange={(e) => setForm({ ...form, commitments_made: e.target.value })}
              />
            </label>
            <label className="full-width">
              Action Items
              <textarea
                rows={2}
                value={form.action_items || ''}
                onChange={(e) => setForm({ ...form, action_items: e.target.value })}
              />
            </label>
            <label className="checkbox-item full-width">
              <input
                type="checkbox"
                checked={!!form.follow_up_required}
                onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })}
              />
              Follow-up required
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted-text">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="muted-text">No events yet. Click "+ New Event" to add one.</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Company</th>
              <th>Participants</th>
              <th>Follow-up?</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <button className="link-button" onClick={() => onSelectEvent(ev.id)}>
                    {new Date(ev.event_date).toLocaleString()}
                  </button>
                </td>
                <td>{ev.event_type || '—'}</td>
                <td>{ev.companies?.name || '—'}</td>
                <td>
                  {(ev.event_participants || []).map((ep) => ep.people?.full_name).join(', ') ||
                    '—'}
                </td>
                <td>{ev.follow_up_required ? 'Yes' : 'No'}</td>
                <td className="row-actions">
                  <button className="link-button" onClick={() => openEditForm(ev)}>
                    Edit
                  </button>
                  <button className="link-button danger" onClick={() => handleDelete(ev.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default EventsPage
