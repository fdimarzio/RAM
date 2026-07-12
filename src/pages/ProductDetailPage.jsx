import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

const EMPTY_EDIT_FORM = {
  name: '',
  category: '',
  status: 'active',
  pricing_info: '',
  description: '',
  notes: ''
}

function ProductDetailPage({ productId, onBack, onNavigate }) {
  const [product, setProduct] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [allOpportunities, setAllOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [saving, setSaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: productData, error: productError },
      { data: oppLinkData },
      { data: allOppData }
    ] = await Promise.all([
      supabase.from('products_services').select('*').eq('id', productId).single(),
      supabase
        .from('opportunity_products')
        .select('opportunity_id, opportunities(id, name, stage, status, companies(name))')
        .eq('product_service_id', productId),
      supabase.from('opportunities').select('id, name').order('name')
    ])

    if (productError) {
      setError(productError.message)
    } else {
      setProduct(productData)
    }
    setOpportunities((oppLinkData || []).map((row) => row.opportunities).filter(Boolean))
    setAllOpportunities(allOppData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  function openEdit() {
    setEditForm({
      name: product.name || '',
      category: product.category || '',
      status: product.status || 'active',
      pricing_info: product.pricing_info || '',
      description: product.description || '',
      notes: product.notes || ''
    })
    setEditing(true)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: editForm.name,
      category: editForm.category || null,
      status: editForm.status || 'active',
      pricing_info: editForm.pricing_info || null,
      description: editForm.description || null,
      notes: editForm.notes || null
    }

    const { error: updateError } = await supabase
      .from('products_services')
      .update(payload)
      .eq('id', productId)
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    loadAll()
  }

  async function handleLinkOpportunity(opportunityId) {
    if (!opportunityId) return
    const { error: linkError } = await supabase
      .from('opportunity_products')
      .insert({ product_service_id: productId, opportunity_id: opportunityId })
    if (linkError) setError(linkError.message)
    else loadAll()
  }

  async function handleUnlinkOpportunity(opportunityId) {
    const { error: unlinkError } = await supabase
      .from('opportunity_products')
      .delete()
      .eq('product_service_id', productId)
      .eq('opportunity_id', opportunityId)
    if (unlinkError) setError(unlinkError.message)
    else loadAll()
  }

  if (loading) return <p className="muted-text">Loading product...</p>
  if (error && !product) return <div className="error-banner">{error}</div>
  if (!product) return <p className="muted-text">Product not found.</p>

  const linkedOpportunityIds = new Set(opportunities.map((o) => o.id))
  const unlinkedOpportunities = allOpportunities.filter((o) => !linkedOpportunityIds.has(o.id))

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Products &amp; Services
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{product.name}</h2>
        <span className={`status-badge status-${product.status}`}>{product.status}</span>
        {!editing && (
          <button className="link-button" onClick={openEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form className="entity-form" onSubmit={handleEditSubmit}>
          <h3>Edit Product/Service</h3>
          <div className="form-grid">
            <label>
              Name *
              <input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </label>
            <label>
              Category
              <input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
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
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </label>
            <label className="full-width">
              Pricing Info
              <textarea
                rows={2}
                value={editForm.pricing_info}
                onChange={(e) => setEditForm({ ...editForm, pricing_info: e.target.value })}
              />
            </label>
            <label className="full-width">
              Notes
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
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
              <strong>Category</strong>
              <p>{product.category || '—'}</p>
            </div>
            <div>
              <strong>Status</strong>
              <p>{product.status || '—'}</p>
            </div>
            <div>
              <strong>Pricing Info</strong>
              <p>{product.pricing_info || '—'}</p>
            </div>
          </div>
          {product.description && (
            <div className="detail-block">
              <strong>Description</strong>
              <p>{product.description}</p>
            </div>
          )}
          {product.notes && (
            <div className="detail-block">
              <strong>Notes</strong>
              <p>{product.notes}</p>
            </div>
          )}
        </>
      )}

      <section className="detail-section">
        <h3>Opportunities ({opportunities.length})</h3>
        {opportunities.length === 0 ? (
          <p className="muted-text">No opportunities linked yet.</p>
        ) : (
          <ul className="simple-list">
            {opportunities.map((o) => (
              <li key={o.id}>
                <button className="link-button" onClick={() => onNavigate('opportunities', o.id)}>
                  {o.name}
                </button>{' '}
                <span className="muted-text">
                  — {o.companies?.name || 'no company'}, {o.stage?.replace('_', ' ')}
                </span>{' '}
                <button
                  className="link-button danger"
                  onClick={() => handleUnlinkOpportunity(o.id)}
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        {unlinkedOpportunities.length > 0 && (
          <select defaultValue="" onChange={(e) => handleLinkOpportunity(e.target.value)}>
            <option value="">+ Link existing opportunity...</option>
            {unlinkedOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="detail-section">
        <h3>Notes</h3>
        <NotesPanel entityType="product" entityId={product.id} />
      </section>
    </div>
  )
}

export default ProductDetailPage
