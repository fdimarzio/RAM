import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function NotesPanel({ entityType, entityId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [author, setAuthor] = useState('Unassigned')
  const [saving, setSaving] = useState(false)

  async function loadNotes() {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setNotes(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (entityId) loadNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId])

  async function handleAddNote(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setSaving(true)
    setError(null)

    const { error: insertError } = await supabase.from('notes').insert({
      entity_type: entityType,
      entity_id: entityId,
      body: draft.trim(),
      author: author || 'Unassigned'
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setDraft('')
      loadNotes()
    }
    setSaving(false)
  }

  async function handleDeleteNote(id) {
    const { error: deleteError } = await supabase.from('notes').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
    } else {
      loadNotes()
    }
  }

  return (
    <div className="notes-panel">
      {error && <div className="error-banner">{error}</div>}
      <form className="notes-add-form" onSubmit={handleAddNote}>
        <textarea
          rows={2}
          placeholder="Add a note..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="notes-add-row">
          <input
            className="notes-author-input"
            placeholder="Author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <button type="submit" className="primary-button" disabled={saving || !draft.trim()}>
            {saving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="muted-text">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="muted-text">No notes yet.</p>
      ) : (
        <ul className="notes-list">
          {notes.map((n) => (
            <li key={n.id} className="note-item">
              <div className="note-body">{n.body}</div>
              <div className="note-meta">
                <span>{n.author}</span>
                <span>{new Date(n.created_at).toLocaleString()}</span>
                <button className="link-button danger" onClick={() => handleDeleteNote(n.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default NotesPanel
