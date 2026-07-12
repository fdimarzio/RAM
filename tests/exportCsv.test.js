import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { rowsToCsv, exportRowsToCsv } from '../src/lib/exportCsv.js'

describe('rowsToCsv', () => {
  it('returns an empty string for no rows', () => {
    expect(rowsToCsv([])).toBe('')
    expect(rowsToCsv(null)).toBe('')
    expect(rowsToCsv(undefined)).toBe('')
  })

  it('builds a header row and data rows', () => {
    const csv = rowsToCsv([{ name: 'Acme', status: 'active' }])
    expect(csv).toBe('name,status\r\nAcme,active')
  })

  it('joins multiple rows with CRLF', () => {
    const csv = rowsToCsv([
      { name: 'Acme', status: 'active' },
      { name: 'Globex', status: 'inactive' }
    ])
    expect(csv).toBe('name,status\r\nAcme,active\r\nGlobex,inactive')
  })

  it('quotes fields containing commas', () => {
    const csv = rowsToCsv([{ name: 'Acme, Inc.' }])
    expect(csv).toBe('name\r\n"Acme, Inc."')
  })

  it('escapes embedded double quotes by doubling them', () => {
    const csv = rowsToCsv([{ note: 'She said "hello"' }])
    expect(csv).toBe('note\r\n"She said ""hello"""')
  })

  it('quotes fields containing newlines', () => {
    const csv = rowsToCsv([{ note: 'line one\nline two' }])
    expect(csv).toBe('note\r\n"line one\nline two"')
  })

  it('renders null and undefined values as empty fields', () => {
    const csv = rowsToCsv([{ a: null, b: undefined, c: 'x' }])
    expect(csv).toBe('a,b,c\r\n,,x')
  })

  it('stringifies numbers, booleans, and objects', () => {
    const csv = rowsToCsv([{ n: 42, ok: true, meta: { a: 1 } }])
    expect(csv).toBe('n,ok,meta\r\n42,true,"{""a"":1}"')
  })

  it('unions column keys across rows that have different shapes', () => {
    const csv = rowsToCsv([{ a: 1 }, { b: 2 }])
    const lines = csv.split('\r\n')
    expect(lines[0].split(',').sort()).toEqual(['a', 'b'])
  })
})

describe('exportRowsToCsv', () => {
  let createObjectURLSpy
  let revokeObjectURLSpy
  let clickSpy

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    global.URL.createObjectURL = createObjectURLSpy
    global.URL.revokeObjectURL = revokeObjectURLSpy
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a download link, clicks it, and revokes the object URL', () => {
    exportRowsToCsv('companies', [{ name: 'Acme' }])

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('appends .csv to the filename if missing', () => {
    let capturedDownload = null
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          set(value) {
            capturedDownload = value
          },
          get() {
            return capturedDownload
          }
        })
      }
      return el
    })

    exportRowsToCsv('companies', [{ name: 'Acme' }])
    expect(capturedDownload).toBe('companies.csv')
  })

  it('does not double-append .csv when already present', () => {
    let capturedDownload = null
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          set(value) {
            capturedDownload = value
          },
          get() {
            return capturedDownload
          }
        })
      }
      return el
    })

    exportRowsToCsv('companies.csv', [{ name: 'Acme' }])
    expect(capturedDownload).toBe('companies.csv')
  })
})
