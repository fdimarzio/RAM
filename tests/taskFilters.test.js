import { describe, it, expect } from 'vitest'
import { isOverdueTask, isDueThisWeekTask, filterTasksBySegment } from '../src/lib/taskFilters.js'

const TODAY = '2026-07-11'

describe('isOverdueTask', () => {
  it('is true for a task due before today that is not done', () => {
    expect(isOverdueTask({ due_date: '2026-07-01', status: 'pending' }, TODAY)).toBe(true)
  })

  it('is false for a task due today', () => {
    expect(isOverdueTask({ due_date: TODAY, status: 'pending' }, TODAY)).toBe(false)
  })

  it('is false for a task due in the future', () => {
    expect(isOverdueTask({ due_date: '2026-08-01', status: 'pending' }, TODAY)).toBe(false)
  })

  it('is false when the task has no due date', () => {
    expect(isOverdueTask({ due_date: null, status: 'pending' }, TODAY)).toBe(false)
  })

  it('is false when the task is already done, even if the due date passed', () => {
    expect(isOverdueTask({ due_date: '2026-07-01', status: 'done' }, TODAY)).toBe(false)
  })
})

describe('isDueThisWeekTask', () => {
  it('is true for a task due within the next 7 days', () => {
    expect(isDueThisWeekTask({ due_date: '2026-07-15', status: 'pending' }, TODAY)).toBe(true)
  })

  it('is true for a task due today', () => {
    expect(isDueThisWeekTask({ due_date: TODAY, status: 'pending' }, TODAY)).toBe(true)
  })

  it('is true for a task due exactly 7 days out', () => {
    expect(isDueThisWeekTask({ due_date: '2026-07-18', status: 'pending' }, TODAY)).toBe(true)
  })

  it('is false for a task due more than 7 days out', () => {
    expect(isDueThisWeekTask({ due_date: '2026-07-19', status: 'pending' }, TODAY)).toBe(false)
  })

  it('is false for an overdue task (before today)', () => {
    expect(isDueThisWeekTask({ due_date: '2026-07-01', status: 'pending' }, TODAY)).toBe(false)
  })

  it('is false when the task is already done', () => {
    expect(isDueThisWeekTask({ due_date: '2026-07-15', status: 'done' }, TODAY)).toBe(false)
  })

  it('is false when the task has no due date', () => {
    expect(isDueThisWeekTask({ due_date: null, status: 'pending' }, TODAY)).toBe(false)
  })
})

describe('filterTasksBySegment', () => {
  const tasks = [
    { id: 1, name: 'Overdue task', due_date: '2026-07-01', status: 'pending' },
    { id: 2, name: 'Due this week task', due_date: '2026-07-15', status: 'pending' },
    { id: 3, name: 'Future task', due_date: '2026-08-01', status: 'pending' },
    { id: 4, name: 'Done task', due_date: '2026-07-01', status: 'done' },
    { id: 5, name: 'No due date task', due_date: null, status: 'pending' }
  ]

  it('returns all tasks unchanged for the "all" segment', () => {
    expect(filterTasksBySegment(tasks, 'all', TODAY)).toEqual(tasks)
  })

  it('returns only overdue tasks for the "overdue" segment', () => {
    const result = filterTasksBySegment(tasks, 'overdue', TODAY)
    expect(result.map((t) => t.id)).toEqual([1])
  })

  it('returns only tasks due this week for the "due_this_week" segment', () => {
    const result = filterTasksBySegment(tasks, 'due_this_week', TODAY)
    expect(result.map((t) => t.id)).toEqual([2])
  })
})
