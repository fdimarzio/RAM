import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './DetailPage.css'

function EventDetailPage({ eventId, onBack }) {
  const [event, setEvent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      </div>

      <div className="detail-summary-grid">
        <div>
          <strong>Company</strong>
          <p>{event.companies?.name || '—'}</p>
        </div>
        <div>
          <strong>Opportunity</strong>
          <p>{event.opportunities?.name || '—'}</p>
        </div>
        <div>
          <strong>Follow-up Required</strong>
          <p>{event.follow_up_required ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="detail-block">
        <strong>Participants</strong>
        <p>
          {(event.event_participants || []).map((ep) => ep.people?.full_name).filter(Boolean).join(', ') ||
            '—'}
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
    </div>
  )
}

export default EventDetailPage
