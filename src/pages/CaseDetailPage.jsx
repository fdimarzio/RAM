import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import QuickAddForm from '../components/QuickAddForm.jsx'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

const EMPTY_EDIT_FORM = {
  name: '',
  case_type: '',
  status: 'open',
  start_date: '',
  target_completion_date: '',
  description: '',
  notes: ''
}

function CaseDetailPage({ caseId, onBack, onNavigate }) {
  const [caseRecord, setCaseRecord] = useState(null)
  const [people, setPeople] = useState([])
  const [companies, setCompanies] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [tasks, setTasks] = useState([])
  const [allPeople, setAllPeople] = useState([])
  const [allCompanies, setAllCompanies] = useState([])
  const [allOpportunities, setAllOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeAddForm, setActiveAddForm] = useState(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [saving, setSaving] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError(null)

    const [
      { data: caseData, error: caseError },
      { data: peopleLinkData },
      { data: companyLinkData },
      { data: oppLinkData },
      { data: taskData },
      { data: allPeopleData },
      { data: allCompanyData },
      { data: allOppData }
    ] = await Promise.all([
      supabase.from('cases').select('*').eq('id', caseId).single(),
      supabase
        .from('case_people')
        .select('person_id, people(id, full_name, title, company_id, companies(name))')
        .eq('case_id', caseId),
      supabase
        .from('case_companies')
        .select('company_id, companies(id, name, status)')
        .eq('case_id', caseId),
      supabase
        .from('case_opportunities')
        .select('opportunity_id, opportunities(id, name, stage, status)')
        .eq('case_id', caseId),
      supabase
        .from('tasks')
        .select('*')
        .eq('case_id', caseId)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('people').select('id, full_name').order('full_name'),
      supabase.from('companies').select('id, name').order('name'),
      supabase.from('opportunities').select('id, name').order('name')
    ])

    if (caseError) {
      setError(caseError.message)
    } else {
      setCaseRecord(caseData)
    }
    setPeople((peopleLinkData || []).map((row) => row.people).filter(Boolean))
    setCompanies((companyLinkData || []).map((row) => row.companies).filter(Boolean))
    setOpportunities((oppLinkData || []).map((row) => row.opportunities).filter(Boolean))
    setTasks(taskData || [])
    setAllPeople(allPeopleData || [])
    setAllCompanies(allCompanyData || [])
    setAllOpportunities(allOppData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  function openEdit() {
    setEditForm({
      name: caseRecord.name || '',
      case_type: caseRecord.case_type || '',
      status: caseRecord.status || 'open',
      start_date: caseRecord.start_date || '',
      target_completion_date: caseRecord.target_completion_date || '',
      description: caseRecord.description || '',
      notes: caseRecord.notes || ''
    })
    setEditing(true)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: editForm.name,
      case_type: editForm.case_type || null,
      status: editForm.status || 'open',
      start_date: editForm.start_date || null,
      target_completion_date: editForm.target_completion_date || null,
      description: editForm.description || null,
      notes: editForm.notes || null
    }

    const { error: updateError } = await supabase.from('cases').update(payload).eq('id', caseId)
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    loadAll()
  }

  async function handleLinkPerson(personId) {
    if (!personId) return
    const { error: linkError } = await supabase
      .from('case_people')
      .insert({ case_id: caseId, person_id: personId })
    if (linkError) setError(linkError.message)
    else loadAll()
  }

  async function handleUnlinkPerson(personId) {
    const { error: unlinkError } = await supabase
      .from('case_people')
      .delete()
      .eq('case_id', caseId)
      .eq('person_id', personId)
    if (unlinkError) setError(unlinkError.message)
    else loadAll()
  }

  async function handleLinkCompany(companyId) {
    if (!companyId) return
    const { error: linkError } = await supabase
      .from('case_companies')
      .insert({ case_id: caseId, company_id: companyId })
    if (linkError) setError(linkError.message)
    else loadAll()
  }

  async function handleUnlinkCompany(companyId) {
    const { error: unlinkError } = await supabase
      .from('case_companies')
      .delete()
      .eq('case_id', caseId)
      .eq('company_id', companyId)
    if (unlinkError) setError(unlinkError.message)
    else loadAll()
  }

  async function handleLinkOpportunity(opportunityId) {
    if (!opportunityId) return
    const { error: linkError } = await supabase
      .from('case_opportunities')
      .insert({ case_id: caseId, opportunity_id: opportunityId })
    if (linkError) setError(linkError.message)
    else loadAll()
  }

  async function handleUnlinkOpportunity(opportunityId) {
    const { error: unlinkError } = await supabase
      .from('case_opportunities')
      .delete()
      .eq('case_id', caseId)
      .eq('opportunity_id', opportunityId)
    if (unlinkError) setError(unlinkError.message)
    else loadAll()
  }

  if (loading) return <p className="muted-text">Loading case...</p>
  if (error && !caseRecord) return <div className="error-banner">{error}</div>
  if (!caseRecord) return <p className="muted-text">Case not found.</p>

  const linkedPersonIds = new Set(people.map((p) => p.id))
  const unlinkedPeople = allPeople.filter((p) => !linkedPersonIds.has(p.id))

  const linkedCompanyIds = new Set(companies.map((c) => c.id))
  const unlinkedCompanies = allCompanies.filter((c) => !linkedCompanyIds.has(c.id))

  const linkedOpportunityIds = new Set(opportunities.map((o) => o.id))
  const unlinkedOpportunities = allOpportunities.filter((o) => !linkedOpportunityIds.has(o.id))

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Cases
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{caseRecord.name}</h2>
        <span className={`status-badge status-${caseRecord.status}`}>
          {caseRecord.status?.replace('_', ' ')}
        </span>
        {!editing && (
          <button className="link-button" onClick={openEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form className="entity-form" onSubmit={handleEditSubmit}>
          <h3>Edit Case</h3>
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
              Type
              <input
                value={editForm.case_type}
                onChange={(e) => setEditForm({ ...editForm, case_type: e.target.value })}
              />
            </label>
            <label>
              Status
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
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
                value={editForm.start_date}
                onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
              />
            </label>
            <label>
              Target Completion Date
              <input
                type="date"
                value={editForm.target_completion_date}
                onChange={(e) =>
                  setEditForm({ ...editForm, target_completion_date: e.target.value })
                }
              />
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
              <strong>Type</strong>
              <p>{caseRecord.case_type || '—'}</p>
            </div>
            <div>
              <strong>Status</strong>
              <p>{caseRecord.status?.replace('_', ' ') || '—'}</p>
            </div>
            <div>
              <strong>Start Date</strong>
              <p>{caseRecord.start_date || '—'}</p>
            </div>
            <div>
              <strong>Target Completion</strong>
              <p>{caseRecord.target_completion_date || '—'}</p>
            </div>
          </div>
          {caseRecord.description && (
            <div className="detail-block">
              <strong>Description</strong>
              <p>{caseRecord.description}</p>
            </div>
          )}
          {caseRecord.notes && (
            <div className="detail-block">
              <strong>Notes</strong>
              <p>{caseRecord.notes}</p>
            </div>
          )}
        </>
      )}

      <section className="detail-section">
        <h3>People ({people.length})</h3>
        {people.length === 0 ? (
          <p className="muted-text">No people linked yet.</p>
        ) : (
          <ul className="simple-list">
            {people.map((p) => (
              <li key={p.id}>
                <button className="link-button" onClick={() => onNavigate('people', p.id)}>
                  {p.full_name}
                </button>{' '}
                <span className="muted-text">
                  — {p.title || 'no title'}
                  {p.companies?.name ? `, ${p.companies.name}` : ''}
                </span>{' '}
                <button className="link-button danger" onClick={() => handleUnlinkPerson(p.id)}>
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        {unlinkedPeople.length > 0 && (
          <select defaultValue="" onChange={(e) => handleLinkPerson(e.target.value)}>
            <option value="">+ Link existing person...</option>
            {unlinkedPeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="detail-section">
        <h3>Companies ({companies.length})</h3>
        {companies.length === 0 ? (
          <p className="muted-text">No companies linked yet.</p>
        ) : (
          <ul className="simple-list">
            {companies.map((c) => (
              <li key={c.id}>
                <button className="link-button" onClick={() => onNavigate('companies', c.id)}>
                  {c.name}
                </button>{' '}
                <span className="muted-text">— {c.status}</span>{' '}
                <button className="link-button danger" onClick={() => handleUnlinkCompany(c.id)}>
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        )}
        {unlinkedCompanies.length > 0 && (
          <select defaultValue="" onChange={(e) => handleLinkCompany(e.target.value)}>
            <option value="">+ Link existing company...</option>
            {unlinkedCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </section>

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
                  — {o.stage?.replace('_', ' ')}, {o.status}
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
        <div className="detail-section-header">
          <h3>Tasks ({tasks.length})</h3>
          {activeAddForm !== 'task' && (
            <button className="link-button" onClick={() => setActiveAddForm('task')}>
              + New Task
            </button>
          )}
        </div>
        {activeAddForm === 'task' && (
          <QuickAddForm
            entityType="task"
            linkField="case_id"
            linkValue={caseId}
            onDone={() => {
              setActiveAddForm(null)
              loadAll()
            }}
            onCancel={() => setActiveAddForm(null)}
          />
        )}
        {tasks.length === 0 ? (
          <p className="muted-text">No tasks linked yet.</p>
        ) : (
          <ul className="simple-list">
            {tasks.map((t) => (
              <li key={t.id}>
                <button className="link-button" onClick={() => onNavigate('tasks', t.id)}>
                  {t.name}
                </button>{' '}
                <span className="muted-text">
                  — due {t.due_date || 'no date'}, {t.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Notes</h3>
        <NotesPanel entityType="case" entityId={caseRecord.id} />
      </section>
    </div>
  )
}

export default CaseDetailPage
