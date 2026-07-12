import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './EntityPage.css'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
    }
    setLoading(false)
  }

  async function handleSignUp() {
    setLoading(true)
    setError(null)
    setInfo(null)

    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
    } else {
      setInfo('Account created. Check your email to confirm (if required), then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <form className="entity-form login-form" onSubmit={handleSignIn}>
        <h3>Sign in to RAM</h3>
        {error && <div className="error-banner">{error}</div>}
        {info && <div className="info-banner">{info}</div>}
        <div className="form-grid">
          <label className="full-width">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="full-width">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={handleSignUp} disabled={loading}>
            Sign Up
          </button>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default LoginPage
