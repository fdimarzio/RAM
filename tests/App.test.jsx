import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App.jsx'
import { AuthProvider } from '../src/lib/AuthContext.jsx'

let mockSession = null

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null })
    }
  }
}))

describe('App (unauthenticated)', () => {
  it('renders the login page when there is no session', async () => {
    mockSession = null
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )
    expect(await screen.findByRole('heading', { name: 'Sign in to RAM' })).toBeTruthy()
  })
})

describe('App (authenticated)', () => {
  it('renders the RAM header once a session resolves', async () => {
    mockSession = { user: { email: 'frank@example.com' } }
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )
    expect(await screen.findByText('RAM')).toBeTruthy()
  })

  it('renders the Companies view by default', async () => {
    mockSession = { user: { email: 'frank@example.com' } }
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )
    expect(await screen.findByRole('heading', { name: 'Companies' })).toBeTruthy()
  })

  it('shows the signed-in user email', async () => {
    mockSession = { user: { email: 'frank@example.com' } }
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    )
    expect(await screen.findByText('frank@example.com')).toBeTruthy()
  })
})
