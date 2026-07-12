export function isOverdueTask(task, today = new Date().toISOString().slice(0, 10)) {
  return !!task.due_date && task.due_date < today && task.status !== 'done'
}

export function isDueThisWeekTask(task, today = new Date().toISOString().slice(0, 10), daysAhead = 7) {
  if (!task.due_date || task.status === 'done') return false
  const end = new Date(today)
  end.setDate(end.getDate() + daysAhead)
  const endStr = end.toISOString().slice(0, 10)
  return task.due_date >= today && task.due_date <= endStr
}

export function filterTasksBySegment(tasks, segment, today = new Date().toISOString().slice(0, 10)) {
  if (segment === 'overdue') return tasks.filter((t) => isOverdueTask(t, today))
  if (segment === 'due_this_week') return tasks.filter((t) => isDueThisWeekTask(t, today))
  return tasks
}
