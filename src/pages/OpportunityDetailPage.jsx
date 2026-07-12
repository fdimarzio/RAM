import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

function OpportunityDetailPage({ opportunityId, onBack, onNavigate }) {
  const [opportunity, setOpportunity] = useState(null)
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: oppData, error: oppError },
      { data: taskData },
      { data: eventData },
      { data: productLinkData },
      { data: allProductData }
    ] = await Promise.all([
      supabase
        .from('opportunities')
        .select('*, companies(id, name), people(id, full_name)')
        .eq('id', opportunityId)
        .single(),
      supabase.from('tasks').select('*').eq('opportunity_id', opportunityId).order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('events').select('*').eq('opportunity_id', opportunityId).order('event_date', { ascending: false }),
      supabase.from('opportunity_products').select('product_service_id, products_services(*)').eq('opportunity_id', opportunityId),
      supabase.from('products_services').select('id, name').order('name')
    ])

    if (oppError) {
      setError(oppError.message)
    } else {
      setOpportunity(oppData)
    }
    setTasks(taskData || [])
    setEvents(eventData || [])
    setProducts((productLinkData || []).map((row) => row.products_services).filter(Boolean))
    setAllProducts(allProductData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId])

  async function handleLinkProduct(productId) {
    if (!productId) return
    const { error: linkError } = await supabase
      .from('opportunity_products')
      .insert({ opportunity_id: opportunityId, product_service_id: productId })
    if (linkError) {
      setError(linkError.message)
    } else {
      loadAll()
    }
  }

  async function handleUnlinkProduct(productId) {
    const { error: unlinkError } = await supabase
      .from('opportunity_products')
      .delete()
      .eq('opportunity_id', opportunityId)
      .eq('product_service_id', productId)
    if (unlinkError) {
      setError(unlinkError.message)
    } else {
      loadAll()
    }
  }

  if (loading) return <p className="muted-text">Loading opportunity...</p>
  if (error && !opportunity) return <div className="error-banner">{error}</div>
  if (!opportunity) return <p className="muted-text">Opportunity not found.</p>

  const linkedProductIds = new Set(products.map((p) => p.id))
  const unlinkedProducts = allProducts.filter((p) => !linkedProductIds.has(p.id))

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Opportunities
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{opportunity.name}</h2>
        <span className={`status-badge status-${opportunity.stage}`}>
          {opportunity.stage?.replace('_', ' ')}
        </span>
        <span className={`status-badge status-${opportunity.status}`}>{opportunity.status}</span>
      </div>

      <div className="detail-summary-grid">
        <div>
          <strong>Company</strong>
          <p>
            {opportunity.companies?.id ? (
              <button
                className="link-button"
                onClick={() => onNavigate('companies', opportunity.companies.id)}
              >
                {opportunity.companies.name}
              </button>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <strong>Person</strong>
          <p>
            {opportunity.people?.id ? (
              <button
                className="link-button"
                onClick={() => onNavigate('people', opportunity.people.id)}
              >
                {opportunity.people.full_name}
              </button>
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <strong>Type</strong>
          <p>{opportunity.opportunity_type || '—'}</p>
        </div>
        <div>
          <strong>Estimated Value</strong>
          <p>
            {opportunity.estimated_value != null
              ? `$${Number(opportunity.estimated_value).toLocaleString()}`
              : '—'}
          </p>
        </div>
        <div>
          <strong>Expected Close Date</strong>
          <p>{opportunity.expected_close_date || '—'}</p>
        </div>
        <div>
          <strong>Probability</strong>
          <p>{opportunity.probability != null ? `${opportunity.probability}%` : '—'}</p>
        </div>
      </div>
      {opportunity.notes && (
        <div className="detail-block">
          <strong>Description Notes</strong>
          <p>{opportunity.notes}</p>
        </div>
      )}

      <section className="detail-section">
        <h3>Products &amp; Services ({products.length})</h3>
        {products.length === 0 ? (
          <p className="muted-text">No products/services linked yet.</p>
        ) : (
          <ul className="simple-list">
            {products.map((p) => (
              <li key={p.id}>
                <button className="link-button" onClick={() => onNavigate('products', p.id)}>
                  {p.name}
                </button>{' '}
                <button className="link-button danger" onClick={() => handleUnlinkProduct(p.id)}>
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        {unlinkedProducts.length > 0 && (
          <select defaultValue="" onChange={(e) => handleLinkProduct(e.target.value)}>
            <option value="">+ Link existing product/service...</option>
            {unlinkedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </section>

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
        <h3>Events ({events.length})</h3>
        {events.length === 0 ? (
          <p className="muted-text">No events linked yet.</p>
        ) : (
          <ul className="simple-list">
            {events.map((ev) => (
              <li key={ev.id}>
                <button className="link-button" onClick={() => onNavigate('events', ev.id)}>
                  {new Date(ev.event_date).toLocaleDateString()}
                </button>{' '}
                <span className="muted-text">— {ev.event_type || 'meeting'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Notes</h3>
        <NotesPanel entityType="opportunity" entityId={opportunity.id} />
      </section>
    </div>
  )
}

export default OpportunityDetailPage
