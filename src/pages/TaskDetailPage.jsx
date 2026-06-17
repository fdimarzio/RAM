import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import NotesPanel from '../components/NotesPanel.jsx'
import './DetailPage.css'

function TaskDetailPage({ taskId, onBack }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadTask() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*, people(id, full_name), companies(id, name), opportunities(id, name), cases(id, name)')
      .eq('id', taskId)
      .single()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setTask(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTask()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  if (loading) return <p className="muted-text">Loading task...</p>
  if (error && !task) return <div className="error-banner">{error}</div>
  if (!task) return <p className="muted-text">Task not found.</p>

  return (
    <div className="detail-page">
      <button className="link-button" onClick={onBack}>
        ← Back to Tasks
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="detail-header">
        <h2>{task.name}</h2>
        <span className={`status-badge status-${task.priority}`}>{task.priority}</span>
        <span className={`status-badge status-${task.status}`}>{task.status?.replace('_', ' ')}</span>
      </div>

      <div className="detail-summary-grid">
        <div>
          <strong>Due Date</strong>
          <p>{task.due_date || '—'}</p>
        </div>
        <div>
          <strong>Owner</strong>
          <p>{task.owner || 'Unassigned'}</p>
        </div>
        <div>
          <strong>Completion Date</strong>
          <p>{task.completion_date || '—'}</p>
        </div>
        <div>
          <strong>Linked Person</strong>
          <p>{task.people?.full_name || '—'}</p>
        </div>
        <div>
          <strong>Linked Company</strong>
          <p>{task.companies?.name || '—'}</p>
        </div>
        <div>
          <strong>Linked Opportunity</strong>
          <p>{task.opportunities?.name || '—'}</p>
        </div>
        <div>
          <strong>Linked Case</strong>
          <p>{task.cases?.name || '—'}</p>
        </div>
      </div>

      {task.description && (
        <div className="detail-block">
          <strong>Description</strong>
          <p>{task.description}</p>
        </div>
      )}

      <section className="detail-section">
        <h3>Notes</h3>
        <NotesPanel entityType="task" entityId={task.id} />
      </section>
    </div>
  )
}

export default TaskDetailPage
