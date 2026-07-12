import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { exportRowsToCsv } from '../lib/exportCsv.js'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  category: '',
  description: '',
  pricing_info: '',
  notes: '',
  status: 'active'
}

function ProductsServicesPage({ onSelectProduct }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  async function loadProducts() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('products_services')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(product) {
    setForm(product)
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
      category: form.category || null,
      description: form.description || null,
      pricing_info: form.pricing_info || null,
      notes: form.notes || null,
      status: form.status || 'active'
    }

    let submitError
    if (form.id) {
      const { error: updateError } = await supabase
        .from('products_services')
        .update(payload)
        .eq('id', form.id)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('products_services').insert(payload)
      submitError = insertError
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    loadProducts()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product/service? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('products_services').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadProducts()
    }
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    )
  })

  function handleExport() {
    exportRowsToCsv('products_services', filtered)
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>Products &amp; Services</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Product/Service
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="list-toolbar">
        <input
          className="search-input"
          placeholder="Search products & services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="export-button" onClick={handleExport}>
          Export CSV
        </button>
      </div>

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Product/Service' : 'New Product/Service'}</h3>
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
              Category
              <input
                value={form.category || ''}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
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
                <option value="discontinued">Discontinued</option>
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
            <label className="full-width">
              Pricing Info
              <textarea
                rows={2}
                value={form.pricing_info || ''}
                onChange={(e) => setForm({ ...form, pricing_info: e.target.value })}
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
        <p className="muted-text">Loading products &amp; services...</p>
      ) : products.length === 0 ? (
        <p className="muted-text">
          No products/services yet. Click "+ New Product/Service" to add one.
        </p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <button className="link-button" onClick={() => onSelectProduct(p.id)}>
                    {p.name}
                  </button>
                </td>
                <td>{p.category || '—'}</td>
                <td>
                  <span className={`status-badge status-${p.status}`}>{p.status}</span>
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

export default ProductsServicesPage
