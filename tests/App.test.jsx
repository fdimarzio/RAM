import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App.jsx'

describe('App', () => {
  it('renders the RAM header', () => {
    render(<App />)
    expect(screen.getByText('RAM')).toBeTruthy()
  })

  it('renders the default dashboard view', () => {
    render(<App />)
    expect(screen.getByText(/Current view: dashboard/)).toBeTruthy()
  })
})
