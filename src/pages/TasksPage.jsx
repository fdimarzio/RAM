import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  due_date: '',
  priority: 'medium',
  status: 'pending',
  owner: 'Unassigned',
  person_id: '',
  company_id: '',
  opportunity_id: '',
  event_id: '',
  case_id: ''
}

function TasksPage({ onSelectTask }) {
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [people, setPeople] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [events, setEvents] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadTasks() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*, people(full_name), companies(name), opportunities(name), cases(name)')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTasks(data || [])
    }
    setLoading(false)
  }

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
  }


  useEffect(() => {
    loadTasks()
    loadLookups()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(task) {
    setForm({
      ...task,
      due_date: task.due_date || '',
      person_id: task.person_id || '',
      company_id: task.company_id || '',
      opportunity_id: task.opportunity_id || '',
      event_id: task.event_id || '',
      case_id: task.case_id || ''
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      description: form.description || null,
      due_date: form.due_date || null,
      priority: form.priority || 'medium',
      status: form.status || 'pending',
      owner: form.owner || 'Unassigned',
      person_id: form.person_id || null,
      company_id: form.company_id || null,
      opportunity_id: form.opportunity_id || null,
      event_id: form.event_id || null,
      case_id: form.case_id || null
    }

    let submitError
    if (form.id) {
      const { error: updateError } = await supabase.from('tasks').update(payload).eq('id', form.id)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('tasks').insert(payload)
      submitError = insertError
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    loadTasks()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadTasks()
    }
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>Tasks &amp; Follow-Ups</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Task
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Task' : 'New Task'}</h3>
          <div className="form-grid">
            <label className="full-width">
              Name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Due Date
              <input
                type="date"
                value={form.due_date || ''}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </label>
            <label>
              Priority
              <select
                value={form.priority || 'medium'}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status || 'pending'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label>
              Owner
              <input
                value={form.owner || 'Unassigned'}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
            </label>
            <label>
              Linked Person
              <select
                value={form.person_id || ''}
                onChange={(e) => setForm({ ...form, person_id: e.target.value })}
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
              Linked Opportunity
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
            <label>
              Linked Event
              <select
                value={form.event_id || ''}
                onChange={(e) => setForm({ ...form, event_id: e.target.value })}
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
                value={form.case_id || ''}
                onChange={(e) => setForm({ ...form, case_id: e.target.value })}
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
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
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
        <p className="muted-text">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="muted-text">No tasks yet. Click "+ New Task" to add one.</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Linked To</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const linkedTo =
                t.people?.full_name ||
                t.companies?.name ||
                t.opportunities?.name ||
                t.cases?.name ||
                '—'
              return (
                <tr key={t.id}>
                  <td>
                    <button className="link-button" onClick={() => onSelectTask(t.id)}>
                      {t.name}
                    </button>
                  </td>
                  <td>{t.due_date || '—'}</td>
                  <td>
                    <span className={`status-badge status-${t.priority}`}>{t.priority}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${t.status}`}>
                      {t.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{t.owner}</td>
                  <td>{linkedTo}</td>
                  <td className="row-actions">
                    <button className="link-button" onClick={() => openEditForm(t)}>
                      Edit
                    </button>
                    <button className="link-button danger" onClick={() => handleDelete(t.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default TasksPage
