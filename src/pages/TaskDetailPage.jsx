import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

function TaskDetailPage({ taskId, onBack, onNavigate }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState([])
  const [people, setPeople] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [events, setEvents] = useState([])
  const [cases, setCases] = useState([])
  const [lookupsLoaded, setLookupsLoaded] = useState(false)

  async function loadTask() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*, people(id, full_name), companies(id, name), opportunities(id, name), cases(id, name)')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTask(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  async function loadLookups() {
    const [
      { data: companyData },
      { data: peopleData },
      { data: oppData },
      { data: eventData },
      { data: caseData }
    ] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('people').select('id, full_name').order('full_name'),
      supabase.from('opportunities').select('id, name').order('name'),
      supabase.from('events').select('id, event_type, event_date').order('event_date', { ascending: false }),
      supabase.from('cases').select('id, name').order('name')
    ])
    setCompanies(companyData || [])
    setPeople(peopleData || [])
    setOpportunities(oppData || [])
    setEvents(eventData || [])
    setCases(caseData || [])
    setLookupsLoaded(true)
  }

  async function openEdit() {
    if (!lookupsLoaded) await loadLookups()
    setEditForm({
      name: task.name || '',
      description: task.description || '',
      due_date: task.due_date || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      owner: task.owner || 'Unassigned',
      person_id: task.person_id || '',
      company_id: task.company_id || '',
      opportunity_id: task.opportunity_id || '',
      event_id: task.event_id || '',
      case_id: task.case_id || ''
    })
    setEditing(true)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: editForm.name,
      description: editForm.description || null,
      due_date: editForm.due_date || null,
      priority: editForm.priority || 'medium',
      status: editForm.status || 'pending',
      owner: editForm.owner || 'Unassigned',
      person_id: editForm.person_id || null,
      company_id: editForm.company_id || null,
      opportunity_id: editForm.opportunity_id || null,
      event_id: editForm.event_id || null,
      case_id: editForm.case_id || null
    }

    const { error: updateError } = await supabase.from('tasks').update(payload).eq('id', taskId)
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    loadTask()
  }

  if (loading) return <p className="muted-text">Loading task...</p>
  if (error && !task) return <div className="error-banner">{error}</div>
  if (!task) return <p className="muted-text">Task not found.</p>

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Tasks
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{task.name}</h2>
        <span className={`status-badge status-${task.priority}`}>{task.priority}</span>
        <span className={`status-badge status-${task.status}`}>{task.status?.replace('_', ' ')}</span>
        {!editing && (
          <button className="link-button" onClick={openEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form className="entity-form" onSubmit={handleEditSubmit}>
          <h3>Edit Task</h3>
          <div className="form-grid">
            <label className="full-width">
              Name *
              <input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </label>
            <label>
              Due Date
              <input
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
              />
            </label>
            <label>
              Priority
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label>
              Owner
              <input
                value={editForm.owner}
                onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
              />
            </label>
            <label>
              Linked Person
              <select
                value={editForm.person_id}
                onChange={(e) => setEditForm({ ...editForm, person_id: e.target.value })}
              >
                <option value="">— None —</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Linked Company
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
              Linked Opportunity
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
            <label>
              Linked Event
              <select
                value={editForm.event_id}
                onChange={(e) => setEditForm({ ...editForm, event_id: e.target.value })}
              >
                <option value="">— None —</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_type || 'Event'} — {new Date(ev.event_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Linked Case
              <select
                value={editForm.case_id}
                onChange={(e) => setEditForm({ ...editForm, case_id: e.target.value })}
              >
                <option value="">— None —</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              Description
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
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
              <strong>Due Date</strong>
              <p>{task.due_date || '—'}</p>
            </div>
            <div>
              <strong>Owner</strong>
              <p>{task.owner || 'Unassigned'}</p>
            </div>
            <div>
              <strong>Completion Date</strong>
              <p>{task.completion_date || '—'}</p>
            </div>
            <div>
              <strong>Linked Person</strong>
              <p>
                {task.people?.id ? (
                  <button className="link-button" onClick={() => onNavigate('people', task.people.id)}>
                    {task.people.full_name}
                  </button>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <strong>Linked Company</strong>
              <p>
                {task.companies?.id ? (
                  <button
                    className="link-button"
                    onClick={() => onNavigate('companies', task.companies.id)}
                  >
                    {task.companies.name}
                  </button>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <strong>Linked Opportunity</strong>
              <p>
                {task.opportunities?.id ? (
                  <button
                    className="link-button"
                    onClick={() => onNavigate('opportunities', task.opportunities.id)}
                  >
                    {task.opportunities.name}
                  </button>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <strong>Linked Case</strong>
              <p>
                {task.cases?.id ? (
                  <button className="link-button" onClick={() => onNavigate('cases', task.cases.id)}>
                    {task.cases.name}
                  </button>
                ) : (
                  '—'
                )}
              </p>
            </div>
          </div>

          {task.description && (
            <div className="detail-block">
              <strong>Description</strong>
              <p>{task.description}</p>
            </div>
          )}
        </>
      )}

      <section className="detail-section">
        <h3>Notes</h3>
        <NotesPanel entityType="task" entityId={task.id} />
      </section>
    </div>
  )
}

export default TaskDetailPage
