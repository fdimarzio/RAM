import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../src/lib/AuthContext.jsx'

let mockSession = null
let authStateCallback = null
const unsubscribeSpy = vi.fn()

vi.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: (cb) => {
        authStateCallback = cb
        return { data: { subscription: { unsubscribe: unsubscribeSpy } } }
      }
    }
  }
}))

function Consumer() {
  const { session, user, loading } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user-email">{user?.email || 'none'}</span>
      <span data-testid="session">{session ? 'present' : 'absent'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockSession = null
    authStateCallback = null
    unsubscribeSpy.mockClear()
  })

  it('throws when useAuth is called outside an AuthProvider', () => {
    const BadConsumer = () => {
      useAuth()
      return null
    }
    expect(() => render(<BadConsumer />)).toThrow(/useAuth must be used within an AuthProvider/)
  })

  it('starts with no session, then resolves getSession() into state', async () => {
    mockSession = { user: { email: 'jane@example.com' } }
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(await screen.findByTestId('session')).toHaveTextContent('present')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('user-email')).toHaveTextContent('jane@example.com')
  })

  it('has no session when getSession resolves to null', async () => {
    mockSession = null
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    expect(await screen.findByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('session')).toHaveTextContent('absent')
    expect(screen.getByTestId('user-email')).toHaveTextContent('none')
  })

  it('updates state when onAuthStateChange fires (e.g. after sign in)', async () => {
    mockSession = null
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )

    await screen.findByTestId('loading')
    expect(screen.getByTestId('session')).toHaveTextContent('absent')

    act(() => {
      authStateCallback('SIGNED_IN', { user: { email: 'new@example.com' } })
    })

    expect(screen.getByTestId('session')).toHaveTextContent('present')
    expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com')
  })

  it('unsubscribes from auth state changes on unmount', async () => {
    const { unmount } = render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    )
    await screen.findByTestId('loading')
    unmount()
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
  })
})
