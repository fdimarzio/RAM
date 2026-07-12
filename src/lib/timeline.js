import { truncate } from './text.js'

export function buildTimeline({ events = [], notes = [], opportunities = [], tasks = [] } = {}) {
  const items = []

  events.forEach((ev) => {
    if (!ev.event_date) return
    items.push({
      date: ev.event_date,
      kind: 'event',
      label: ev.event_type || 'Event',
      entityType: 'events',
      entityId: ev.id
    })
  })

  notes.forEach((n) => {
    if (!n.created_at) return
    items.push({
      date: n.created_at,
      kind: 'note',
      label: truncate(n.body, 80),
      entityType: null,
      entityId: null
    })
  })

  opportunities.forEach((o) => {
    const date = o.created_at || o.expected_close_date
    if (!date) return
    items.push({
      date,
      kind: 'opportunity',
      label: o.name,
      entityType: 'opportunities',
      entityId: o.id
    })
  })

  tasks.forEach((t) => {
    const date = t.due_date || t.created_at
    if (!date) return
    items.push({
      date,
      kind: 'task',
      label: t.name,
      entityType: 'tasks',
      entityId: t.id
    })
  })

  return items.sort((a, b) => new Date(b.date) - new Date(a.date))
}
