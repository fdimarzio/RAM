import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { exportRowsToCsv } from '../lib/exportCsv.js'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  industry: '',
  website: '',
  address: '',
  description: '',
  status: 'active',
  relationship_notes: ''
}

function CompaniesPage({ onSelectCompany }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function loadCompanies() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCompanies(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(company) {
    setForm(company)
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
      industry: form.industry || null,
      website: form.website || null,
      address: form.address || null,
      description: form.description || null,
      status: form.status || 'active',
      relationship_notes: form.relationship_notes || null
    }

    let submitError
    if (form.id) {
      const { error: updateError } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', form.id)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('companies').insert(payload)
      submitError = insertError
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    loadCompanies()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this company? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('companies').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadCompanies()
    }
  }

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase()
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q)
    )
  })

  function handleExport() {
    exportRowsToCsv('companies', filtered)
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>Companies</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Company
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="list-toolbar">
        <input
          className="search-input"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="export-button" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Company' : 'New Company'}</h3>
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
              Industry
              <input
                value={form.industry || ''}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </label>
            <label>
              Website
              <input
                value={form.website || ''}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={form.status || 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </label>
            <label className="full-width">
              Address
              <input
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
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
              Relationship Notes
              <textarea
                rows={2}
                value={form.relationship_notes || ''}
                onChange={(e) => setForm({ ...form, relationship_notes: e.target.value })}
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
        <p className="muted-text">Loading companies...</p>
      ) : companies.length === 0 ? (
        <p className="muted-text">No companies yet. Click "+ New Company" to add one.</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Industry</th>
              <th>Status</th>
              <th>Website</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <button className="link-button" onClick={() => onSelectCompany(c.id)}>
                    {c.name}
                  </button>
                </td>
                <td>{c.industry || '—'}</td>
                <td>
                  <span className={`status-badge status-${c.status}`}>{c.status}</span>
                </td>
                <td>{c.website || '—'}</td>
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

export default CompaniesPage
