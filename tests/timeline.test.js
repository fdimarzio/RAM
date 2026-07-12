import { describe, it, expect } from 'vitest'
import { buildTimeline } from '../src/lib/timeline.js'

describe('buildTimeline', () => {
  it('returns an empty array when given no data', () => {
    expect(buildTimeline()).toEqual([])
    expect(buildTimeline({})).toEqual([])
  })

  it('merges events, notes, opportunities, and tasks into one array', () => {
    const result = buildTimeline({
      events: [{ id: 'e1', event_type: 'Meeting', event_date: '2026-01-01T00:00:00Z' }],
      notes: [{ id: 'n1', body: 'Called about renewal', created_at: '2026-01-02T00:00:00Z' }],
      opportunities: [{ id: 'o1', name: 'Renewal Deal', created_at: '2026-01-03T00:00:00Z' }],
      tasks: [{ id: 't1', name: 'Send contract', due_date: '2026-01-04' }]
    })

    expect(result).toHaveLength(4)
    expect(result.map((item) => item.kind).sort()).toEqual(['event', 'note', 'opportunity', 'task'])
  })

  it('sorts items descending by date, most recent first', () => {
    const result = buildTimeline({
      events: [{ id: 'e1', event_type: 'Old Meeting', event_date: '2020-01-01T00:00:00Z' }],
      tasks: [{ id: 't1', name: 'Recent Task', due_date: '2026-06-01' }],
      opportunities: [{ id: 'o1', name: 'Mid Deal', created_at: '2023-01-01T00:00:00Z' }]
    })

    expect(result.map((item) => item.label)).toEqual(['Recent Task', 'Mid Deal', 'Old Meeting'])
  })

  it('falls back from task due_date to created_at when due_date is missing', () => {
    const result = buildTimeline({
      tasks: [{ id: 't1', name: 'No due date task', due_date: null, created_at: '2026-02-01T00:00:00Z' }]
    })

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-02-01T00:00:00Z')
  })

  it('falls back from opportunity created_at to expected_close_date', () => {
    const result = buildTimeline({
      opportunities: [
        { id: 'o1', name: 'No created_at', created_at: null, expected_close_date: '2026-03-01' }
      ]
    })

    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-03-01')
  })

  it('omits items with no usable date instead of crashing', () => {
    const result = buildTimeline({
      tasks: [{ id: 't1', name: 'No dates at all', due_date: null, created_at: null }],
      opportunities: [{ id: 'o1', name: 'No dates either', created_at: null, expected_close_date: null }]
    })

    expect(result).toEqual([])
  })

  it('gives notes a null entityType/entityId since they are not independently navigable', () => {
    const result = buildTimeline({
      notes: [{ id: 'n1', body: 'A note', created_at: '2026-01-01T00:00:00Z' }]
    })

    expect(result[0].entityType).toBeNull()
    expect(result[0].entityId).toBeNull()
  })

  it('truncates long note bodies for the label', () => {
    const longBody = 'x'.repeat(200)
    const result = buildTimeline({
      notes: [{ id: 'n1', body: longBody, created_at: '2026-01-01T00:00:00Z' }]
    })

    expect(result[0].label.length).toBeLessThan(longBody.length)
    expect(result[0].label.endsWith('…')).toBe(true)
  })

  it('points events/opportunities/tasks at the right entityType for onNavigate', () => {
    const result = buildTimeline({
      events: [{ id: 'e1', event_type: 'Call', event_date: '2026-01-01T00:00:00Z' }],
      opportunities: [{ id: 'o1', name: 'Deal', created_at: '2026-01-01T00:00:00Z' }],
      tasks: [{ id: 't1', name: 'Task', due_date: '2026-01-01' }]
    })

    const byKind = Object.fromEntries(result.map((item) => [item.kind, item]))
    expect(byKind.event).toMatchObject({ entityType: 'events', entityId: 'e1' })
    expect(byKind.opportunity).toMatchObject({ entityType: 'opportunities', entityId: 'o1' })
    expect(byKind.task).toMatchObject({ entityType: 'tasks', entityId: 't1' })
  })
})
