import { describe, it, expect } from 'vitest'
import { truncate } from '../src/lib/text.js'

describe('truncate', () => {
  it('returns an empty string for null/undefined/empty input', () => {
    expect(truncate(null, 10)).toBe('')
    expect(truncate(undefined, 10)).toBe('')
    expect(truncate('', 10)).toBe('')
  })

  it('returns the original text unchanged when shorter than maxLength', () => {
    expect(truncate('short text', 80)).toBe('short text')
  })

  it('returns the original text unchanged when exactly maxLength', () => {
    const text = 'x'.repeat(10)
    expect(truncate(text, 10)).toBe(text)
  })

  it('truncates and appends an ellipsis when longer than maxLength', () => {
    const text = 'x'.repeat(100)
    const result = truncate(text, 80)
    expect(result).toHaveLength(81)
    expect(result.endsWith('…')).toBe(true)
    expect(result.startsWith('x'.repeat(80))).toBe(true)
  })
})
