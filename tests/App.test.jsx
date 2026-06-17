import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App.jsx'

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null })
      })
    })
  }
}))

describe('App', () => {
  it('renders the RAM header', () => {
    render(<App />)
    expect(screen.getByText('RAM')).toBeTruthy()
  })

  it('renders the Companies view by default', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Companies' })).toBeTruthy()
  })
})
