import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  case_type: '',
  description: '',
  status: 'open',
  start_date: '',
  target_completion_date: '',
  notes: ''
}

function CasesPage() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadCases() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCases(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCases()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(c) {
    setForm({
      ...c,
      start_date: c.start_date || '',
      target_completion_date: c.target_completion_date || ''
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
      case_type: form.case_type || null,
      description: form.description || null,
      status: form.status || 'open',
      start_date: form.start_date || null,
      target_completion_date: form.target_completion_date || null,
      notes: form.notes || null
    }

    let submitError
    if (form.id) {
      const { error: updateError } = await supabase.from('cases').update(payload).eq('id', form.id)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('cases').insert(payload)
      submitError = insertError
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    loadCases()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this case? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('cases').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadCases()
    }
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>Cases</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Case
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Case' : 'New Case'}</h3>
          <div className="form-grid">
            <label>
              Name *
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Type
              <input
                placeholder="e.g. Onboarding, Issue, Initiative"
                value={form.case_type || ''}
                onChange={(e) => setForm({ ...form, case_type: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={form.status || 'open'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label>
              Start Date
              <input
                type="date"
                value={form.start_date || ''}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </label>
            <label>
              Target Completion Date
              <input
                type="date"
                value={form.target_completion_date || ''}
                onChange={(e) => setForm({ ...form, target_completion_date: e.target.value })}
              />
            </label>
            <label className="full-width">
              Description
              <textarea
                rows={2}
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <label className="full-width">
              Notes
              <textarea
                rows={2}
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
        <p className="muted-text">Loading cases...</p>
      ) : cases.length === 0 ? (
        <p className="muted-text">No cases yet. Click "+ New Case" to add one.</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Target Completion</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.case_type || '—'}</td>
                <td>
                  <span className={`status-badge status-${c.status}`}>
                    {c.status?.replace('_', ' ')}
                  </span>
                </td>
                <td>{c.start_date || '—'}</td>
                <td>{c.target_completion_date || '—'}</td>
                <td className="row-actions">
                  <button className="link-button" onClick={() => openEditForm(c)}>
                    Edit
                  </button>
                  <button className="link-button danger" onClick={() => handleDelete(c.id)}>
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

export default CasesPage
