import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Pre-fills the company_id or person_id based on where it's launched from.
// linkField is 'company_id' or 'person_id'; linkValue is that record's id.
function QuickAddForm({ entityType, linkField, linkValue, onDone, onCancel }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fields, setFields] = useState(() => defaultFields(entityType))

  function update(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = buildPayload(entityType, fields, linkField, linkValue)
    const { data: inserted, error: insertError } = await supabase
      .from(tableFor(entityType))
      .insert(payload)
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onDone(inserted?.id)
  }

  return (
    <form className="quick-add-form" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}
      {renderFields(entityType, fields, update)}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function tableFor(entityType) {
  return (
    {
      opportunity: 'opportunities',
      task: 'tasks',
      case: 'cases',
      event: 'events'
    }[entityType]
  )
}

function defaultFields(entityType) {
  switch (entityType) {
    case 'opportunity':
      return { name: '', opportunity_type: '', stage: 'new', status: 'open' }
    case 'task':
      return { name: '', due_date: '', priority: 'medium', status: 'pending', owner: 'Unassigned' }
    case 'case':
      return { name: '', case_type: '', status: 'open' }
    case 'event':
      return { event_type: '', event_date: '', meeting_notes: '' }
    default:
      return {}
  }
}

function buildPayload(entityType, fields, linkField, linkValue) {
  const base = { ...fields }
  // Clean up empty strings to null for optional fields
  Object.keys(base).forEach((k) => {
    if (base[k] === '') base[k] = null
  })

  if (entityType === 'event') {
    base.event_date = fields.event_date ? new Date(fields.event_date).toISOString() : null
  }

  // case_companies / case_people are join tables, not a direct column on cases,
  // so Cases need a follow-up insert handled by the caller after creation.
  if (entityType !== 'case' && linkField) {
    base[linkField] = linkValue
  }

  return base
}

function renderFields(entityType, fields, update) {
  switch (entityType) {
    case 'opportunity':
      return (
        <div className="form-grid">
          <label className="full-width">
            Name *
            <input required value={fields.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label>
            Type
            <input
              value={fields.opportunity_type}
              onChange={(e) => update('opportunity_type', e.target.value)}
            />
          </label>
          <label>
            Stage
            <select value={fields.stage} onChange={(e) => update('stage', e.target.value)}>
              {['new', 'qualifying', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].map(
                (s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      )
    case 'task':
      return (
        <div className="form-grid">
          <label className="full-width">
            Name *
            <input required value={fields.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label>
            Due Date
            <input
              type="date"
              value={fields.due_date}
              onChange={(e) => update('due_date', e.target.value)}
            />
          </label>
          <label>
            Priority
            <select value={fields.priority} onChange={(e) => update('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Owner
            <input value={fields.owner} onChange={(e) => update('owner', e.target.value)} />
          </label>
        </div>
      )
    case 'case':
      return (
        <div className="form-grid">
          <label className="full-width">
            Name *
            <input required value={fields.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label>
            Type
            <input
              placeholder="e.g. Onboarding, Issue, Initiative"
              value={fields.case_type}
              onChange={(e) => update('case_type', e.target.value)}
            />
          </label>
        </div>
      )
    case 'event':
      return (
        <div className="form-grid">
          <label>
            Type
            <input
              placeholder="e.g. Meeting, Call"
              value={fields.event_type}
              onChange={(e) => update('event_type', e.target.value)}
            />
          </label>
          <label>
            Date &amp; Time *
            <input
              required
              type="datetime-local"
              value={fields.event_date}
              onChange={(e) => update('event_date', e.target.value)}
            />
          </label>
          <label className="full-width">
            Meeting Notes
            <textarea
              rows={2}
              value={fields.meeting_notes}
              onChange={(e) => update('meeting_notes', e.target.value)}
            />
          </label>
        </div>
      )
    default:
      return null
  }
}

export default QuickAddForm
