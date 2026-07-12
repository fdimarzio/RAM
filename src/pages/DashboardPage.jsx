import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { truncate } from '../lib/text.js'
import './DashboardPage.css'

function DashboardPage({ onNavigate }) {
  const [openTaskCount, setOpenTaskCount] = useState(0)
  const [dueThisWeekCount, setDueThisWeekCount] = useState(0)
  const [overdueCount, setOverdueCount] = useState(0)
  const [overdueTasks, setOverdueTasks] = useState([])
  const [openOpportunities, setOpenOpportunities] = useState([])
  const [followUpEvents, setFollowUpEvents] = useState([])
  const [outstandingCommitments, setOutstandingCommitments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const today = new Date().toISOString().slice(0, 10)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)

      const [
        openTasksRes,
        dueThisWeekRes,
        overdueCountRes,
        overdueTasksRes,
        openOppsRes,
        followUpRes,
        commitmentsRes
      ] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).neq('status', 'done'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'done')
          .gte('due_date', today)
          .lte('due_date', sevenDaysFromNow),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .neq('status', 'done')
          .lt('due_date', today),
        supabase
          .from('tasks')
          .select('id, name, due_date')
          .neq('status', 'done')
          .lt('due_date', today)
          .order('due_date', { ascending: true })
          .limit(5),
        supabase.from('opportunities').select('id, stage, estimated_value').eq('status', 'open'),
        supabase
          .from('events')
          .select('id, event_type, event_date, companies(name)')
          .eq('follow_up_required', true)
          .order('event_date', { ascending: false })
          .limit(5),
        supabase
          .from('events')
          .select('id, event_type, event_date, commitments_made, companies(name)')
          .not('commitments_made', 'is', null)
          .neq('commitments_made', '')
          .order('event_date', { ascending: false })
          .limit(5)
      ])

      if (openTasksRes.error) setError(openTasksRes.error.message)
      setOpenTaskCount(openTasksRes.count || 0)
      setDueThisWeekCount(dueThisWeekRes.count || 0)
      setOverdueCount(overdueCountRes.count || 0)
      setOverdueTasks(overdueTasksRes.data || [])
      setOpenOpportunities(openOppsRes.data || [])
      setFollowUpEvents(followUpRes.data || [])
      setOutstandingCommitments(commitmentsRes.data || [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <p className="muted-text">Loading dashboard...</p>

  const pipelineByStage = openOpportunities.reduce((acc, o) => {
    const stage = o.stage || 'new'
    if (!acc[stage]) acc[stage] = { count: 0, total: 0 }
    acc[stage].count += 1
    acc[stage].total += Number(o.estimated_value) || 0
    return acc
  }, {})

  return (
    <div className="dashboard">
      {error && <div className="error-banner">{error}</div>}

      <div className="stat-cards">
        <div className="stat-card">
          <p className="stat-label">Open Tasks</p>
          <p className="stat-value">{openTaskCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Due This Week</p>
          <p className="stat-value">{dueThisWeekCount}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Open Opportunities</p>
          <p className="stat-value">{openOpportunities.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Follow-Up Needed</p>
          <p className="stat-value">{followUpEvents.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Overdue</p>
          <p className="stat-value">{overdueCount}</p>
        </div>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-panel">
          <h3>Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <p className="muted-text">No overdue tasks.</p>
          ) : (
            overdueTasks.map((t) => (
              <div className="recent-event-item" key={t.id}>
                <button className="link-button" onClick={() => onNavigate('tasks', t.id)}>
                  {t.name}
                </button>{' '}
                <span className="muted-text">— due {t.due_date}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Pipeline by Stage</h3>
          {Object.keys(pipelineByStage).length === 0 ? (
            <p className="muted-text">No open opportunities.</p>
          ) : (
            Object.entries(pipelineByStage).map(([stage, info]) => (
              <div className="pipeline-row" key={stage}>
                <span className={`status-badge status-${stage}`}>{stage.replace('_', ' ')}</span>
                <span>{info.count} opp{info.count === 1 ? '' : 's'}</span>
                <span>${info.total.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Follow-Up Events</h3>
          {followUpEvents.length === 0 ? (
            <p className="muted-text">No follow-up events.</p>
          ) : (
            followUpEvents.map((ev) => (
              <div className="recent-event-item" key={ev.id}>
                <button className="link-button" onClick={() => onNavigate('events', ev.id)}>
                  {new Date(ev.event_date).toLocaleDateString()}
                </button>{' '}
                — {ev.event_type || 'Event'} <span className="muted-text">— {ev.companies?.name || 'no company'}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Outstanding Commitments</h3>
          {outstandingCommitments.length === 0 ? (
            <p className="muted-text">No outstanding commitments.</p>
          ) : (
            outstandingCommitments.map((ev) => (
              <div className="recent-event-item" key={ev.id}>
                <button className="link-button" onClick={() => onNavigate('events', ev.id)}>
                  {ev.event_type || 'Event'} — {new Date(ev.event_date).toLocaleDateString()}
                </button>{' '}
                <span className="muted-text">— {ev.companies?.name || 'no company'}</span>
                <p className="muted-text">{truncate(ev.commitments_made, 120)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
