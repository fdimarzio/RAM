import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EntityPage.css'

const EMPTY_FORM = {
  id: null,
  name: '',
  opportunity_type: '',
  stage: 'new',
  status: 'open',
  company_id: '',
  person_id: '',
  estimated_value: '',
  expected_close_date: '',
  probability: '',
  notes: ''
}

const STAGES = ['new', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

function OpportunitiesPage({ onSelectOpportunity }) {
  const [opportunities, setOpportunities] = useState([])
  const [companies, setCompanies] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadOpportunities() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('opportunities')
      .select('*, companies(name), people(full_name)')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setOpportunities(data || [])
    }
    setLoading(false)
  }

  async function loadLookups() {
    const [{ data: companyData }, { data: peopleData }] = await Promise.all([
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('people').select('id, full_name').order('full_name')
    ])
    setCompanies(companyData || [])
    setPeople(peopleData || [])
  }

  useEffect(() => {
    loadOpportunities()
    loadLookups()
  }, [])

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(opp) {
    setForm({
      ...opp,
      company_id: opp.company_id || '',
      person_id: opp.person_id || '',
      estimated_value: opp.estimated_value ?? '',
      expected_close_date: opp.expected_close_date || '',
      probability: opp.probability ?? ''
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
      opportunity_type: form.opportunity_type || null,
      stage: form.stage || 'new',
      status: form.status || 'open',
      company_id: form.company_id || null,
      person_id: form.person_id || null,
      estimated_value: form.estimated_value === '' ? null : Number(form.estimated_value),
      expected_close_date: form.expected_close_date || null,
      probability: form.probability === '' ? null : Number(form.probability),
      notes: form.notes || null
    }

    let submitError
    if (form.id) {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update(payload)
        .eq('id', form.id)
      submitError = updateError
    } else {
      const { error: insertError } = await supabase.from('opportunities').insert(payload)
      submitError = insertError
    }

    if (submitError) {
      setError(submitError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    closeForm()
    loadOpportunities()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('opportunities').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadOpportunities()
    }
  }

  return (
    <div className="entity-page">
      <div className="entity-page-header">
        <h2>Opportunities</h2>
        <button className="primary-button" onClick={openCreateForm}>
          + New Opportunity
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="entity-form" onSubmit={handleSubmit}>
          <h3>{form.id ? 'Edit Opportunity' : 'New Opportunity'}</h3>
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
                placeholder="e.g. New Business, Renewal, Referral"
                value={form.opportunity_type || ''}
                onChange={(e) => setForm({ ...form, opportunity_type: e.target.value })}
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
              Person
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
              Stage
              <select
                value={form.stage || 'new'}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status || 'open'}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="open">Open</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="on_hold">On Hold</option>
              </select>
            </label>
            <label>
              Estimated Value ($)
              <input
                type="number"
                step="0.01"
                value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
              />
            </label>
            <label>
              Expected Close Date
              <input
                type="date"
                value={form.expected_close_date || ''}
                onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
              />
            </label>
            <label>
              Probability (%)
              <input
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })}
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
        <p className="muted-text">Loading opportunities...</p>
      ) : opportunities.length === 0 ? (
        <p className="muted-text">No opportunities yet. Click "+ New Opportunity" to add one.</p>
      ) : (
        <table className="entity-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Person</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Value</th>
              <th>Close Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((o) => (
              <tr key={o.id}>
                <td>
                  <button className="link-button" onClick={() => onSelectOpportunity(o.id)}>
                    {o.name}
                  </button>
                </td>
                <td>{o.companies?.name || '—'}</td>
                <td>{o.people?.full_name || '—'}</td>
                <td>
                  <span className={`status-badge status-${o.stage}`}>
                    {o.stage?.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                </td>
                <td>{o.estimated_value != null ? `$${Number(o.estimated_value).toLocaleString()}` : '—'}</td>
                <td>{o.expected_close_date || '—'}</td>
                <td className="row-actions">
                  <button className="link-button" onClick={() => openEditForm(o)}>
                    Edit
                  </button>
                  <button className="link-button danger" onClick={() => handleDelete(o.id)}>
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

export default OpportunitiesPage
