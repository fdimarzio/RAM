import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  full_name: '',
  title: '',
  email: '',
  phone: '',
  company_id: '',
  department: '',
  relationship_type: '',
  relationship_status: 'active',
  personal_notes: ''
}

function PeoplePage() {
  const [people, setPeople] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadPeople() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('people')
      .select('*, companies(name)')
      .order('full_name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPeople(data || [])
    }
    setLoading(false)
  }

  async function loadCompanies() {
    const { data, error: fetchError } = await supabase
      .from('companies')
      .select('id, name')
      .order('name', { ascending: true })

    if (!fetchError) {
      setCompanies(data || [])
    }
  }

  useEffect(() => {
    loadPeople()
    loadCompanies()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(person) {
    setForm({ ...person, company_id: person.company_id || '' })
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
      full_name: form.full_name,
      title: form.title || null,
      email: form.email || null,
      phone: form.phone || null,
      company_id: form.company_id || null,
      department: form.department || null,
      relationship_type: form.relationship_type || null,
      relationship_status: form.relationship_status || 'active',
      personal_notes: form.personal_notes || null
    }

    let submitError
    if (form.id) {
      const { error: updateError } = await supabase
        .from('people')
        .update(payload)
        .eq('id', form.id)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('people').insert(payload)
      submitError = insertError
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    loadPeople()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this person? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('people').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadPeople()
    }
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>People</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Person
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Person' : 'New Person'}</h3>
          <div className="form-grid">
            <label>
              Full Name *
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </label>
            <label>
              Title / Position
              <input
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
              Department
              <input
                value={form.department || ''}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </label>
            <label>
              Relationship Type
              <input
                placeholder="e.g. Client, Partner, Investor, Advisor"
                value={form.relationship_type || ''}
                onChange={(e) => setForm({ ...form, relationship_type: e.target.value })}
              />
            </label>
            <label>
              Relationship Status
              <select
                value={form.relationship_status || 'active'}
                onChange={(e) => setForm({ ...form, relationship_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </label>
            <label className="full-width">
              Personal Notes
              <textarea
                rows={2}
                value={form.personal_notes || ''}
                onChange={(e) => setForm({ ...form, personal_notes: e.target.value })}
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
        <p className="muted-text">Loading people...</p>
      ) : people.length === 0 ? (
        <p className="muted-text">No people yet. Click "+ New Person" to add one.</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Company</th>
              <th>Email</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>{p.title || '—'}</td>
                <td>{p.companies?.name || '—'}</td>
                <td>{p.email || '—'}</td>
                <td>
                  <span className={`status-badge status-${p.relationship_status}`}>
                    {p.relationship_status}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="link-button" onClick={() => openEditForm(p)}>
                    Edit
                  </button>
                  <button className="link-button danger" onClick={() => handleDelete(p.id)}>
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

export default PeoplePage
