import React, { useEffect, useState } from 'react'
import { useLanguage } from './LanguageContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const [healthStatus, setHealthStatus] = useState('loading')

  const [villages, setVillages] = useState([])
  const [villagesLoading, setVillagesLoading] = useState(true)
  const [villagesError, setVillagesError] = useState(null)
  
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState(null)

  const [schemes, setSchemes] = useState([])
  const [schemesLoading, setSchemesLoading] = useState(true)
  const [schemesError, setSchemesError] = useState(null)
  const [schemeCategory, setSchemeCategory] = useState('all')

  const [assistantQuery, setAssistantQuery] = useState('')
  const [assistantAnswer, setAssistantAnswer] = useState(null)
  const [assistantLoading, setAssistantLoading] = useState(false)

  const [grievanceForm, setGrievanceForm] = useState({ name: '', category: 'water', issue: '' })
  const [grievanceStatus, setGrievanceStatus] = useState(null)
  const [grievanceSubmitting, setGrievanceSubmitting] = useState(false)

  const [form, setForm] = useState({ village_id: '', category: 'other', description: '', severity: 'medium' })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [filters, setFilters] = useState({ district: '', category: '', severity: '', status: '' })

  useEffect(() => {
    setHealthStatus('loading')
    fetch(`${API_BASE}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed')
        return res.json()
      })
      .then((data) => {
        setHealthStatus(data.status === 'ok' ? 'connected' : 'disconnected')
      })
      .catch(() => setHealthStatus('disconnected'))
  }, [])

  useEffect(() => {
    setVillagesLoading(true)
    setVillagesError(null)
    fetch(`${API_BASE}/api/villages`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then((data) => {
        setVillages(data?.data || [])
      })
      .catch((err) => setVillagesError(err.message || 'Failed to load'))
      .finally(() => setVillagesLoading(false))
  }, [])

  // fetch alerts
  const fetchAlerts = () => {
    setAlertsLoading(true)
    setAlertsError(null)
    fetch(`${API_BASE}/api/alerts`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then((data) => setAlerts(data?.data || []))
      .catch((err) => setAlertsError(err.message || 'Failed to load alerts'))
      .finally(() => setAlertsLoading(false))
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/api/schemes`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load schemes')
        return res.json()
      })
      .then((data) => setSchemes(data?.data || []))
      .catch((err) => setSchemesError(err.message || 'Failed to load schemes'))
      .finally(() => setSchemesLoading(false))
  }, [])

  const askAssistant = async () => {
    const query = assistantQuery.trim()
    if (!query) return

    setAssistantLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/assistant/query?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Assistant request failed')
      setAssistantAnswer(data)
    } catch (err) {
      setAssistantAnswer({ answer: err.message || 'Something went wrong. Please try again.', matches: [] })
    } finally {
      setAssistantLoading(false)
    }
  }

  const submitGrievance = async (event) => {
    event.preventDefault()
    if (!grievanceForm.name.trim() || !grievanceForm.issue.trim()) {
      setGrievanceStatus({ type: 'error', message: t('fillFields') })
      return
    }

    setGrievanceSubmitting(true)
    setGrievanceStatus(null)
    try {
      const response = await fetch(`${API_BASE}/api/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: grievanceForm.name, issue: grievanceForm.issue })
      })
      if (!response.ok) throw new Error(t('submissionFailed'))
      setGrievanceForm({ name: '', category: 'water', issue: '' })
      setGrievanceStatus({ type: 'success', message: t('grievanceSuccess') })
    } catch (error) {
      setGrievanceStatus({ type: 'error', message: error.message || t('serverUnavailable') })
    } finally {
      setGrievanceSubmitting(false)
    }
  }

  const districts = Array.from(new Set(villages.map(v => v.district).filter(Boolean))).sort()
  const schemeCategories = Array.from(new Set(schemes.map(s => s.category))).sort()
  const visibleSchemes = schemeCategory === 'all'
    ? schemes
    : schemes.filter(scheme => scheme.category === schemeCategory)
  const categories = ['water', 'health', 'crop', 'road', 'other']
  const severities = ['low', 'medium', 'high', 'critical']
  const statuses = ['pending', 'in-progress', 'resolved']

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1>{t('appTitle')}</h1>
        <button type="button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} style={{ padding: '8px 12px' }}>
          {lang === 'en' ? 'हिंदी' : 'English'}
        </button>
      </header>

      <div style={{ marginBottom: 12 }}>
        <strong>{t('backend')} </strong>
        {healthStatus === 'loading' && <span>{t('checking')}</span>}
        {healthStatus === 'connected' && (
          <span style={{ color: 'green' }}>{t('connected')} ✅</span>
        )}
        {healthStatus === 'disconnected' && (
          <span style={{ color: 'red' }}>{t('disconnected')} ❌</span>
        )}
      </div>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>{t('assistant')}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={assistantQuery}
            onChange={(e) => setAssistantQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') askAssistant() }}
            placeholder={t('assistantPlaceholder')}
            style={{ flex: 1, padding: 8 }}
          />
          <button type="button" onClick={askAssistant} disabled={assistantLoading} style={{ padding: '8px 12px' }}>
            {assistantLoading ? t('thinking') : t('ask')}
          </button>
        </div>
        {assistantAnswer && (
          <div style={{ marginTop: 10, padding: 12, background: '#f5f7fa', borderLeft: '3px solid #2563eb' }}>
            <p style={{ margin: 0 }}>{assistantAnswer.answer}</p>
            {assistantAnswer.matches?.length > 0 && (
              <small>{t('relatedSchemes')} {assistantAnswer.matches.map(scheme => scheme.name).join(', ')}</small>
            )}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>{t('schemes')}</h2>
        {schemesLoading && <div>{t('loadingSchemes')}</div>}
        {schemesError && <div style={{ color: 'red' }}>Error: {schemesError}</div>}
        {!schemesLoading && !schemesError && (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <button type="button" onClick={() => setSchemeCategory('all')} style={{ padding: '6px 8px', fontWeight: schemeCategory === 'all' ? 'bold' : 'normal' }}>{t('all')}</button>
              {schemeCategories.map(category => (
                <button key={category} type="button" onClick={() => setSchemeCategory(category)} style={{ padding: '6px 8px', fontWeight: schemeCategory === category ? 'bold' : 'normal' }}>
                  {category}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {visibleSchemes.map(scheme => (
                <article key={scheme.id} style={{ border: '1px solid #ddd', padding: 12 }}>
                  <h3 style={{ margin: '0 0 6px' }}>{scheme.name}</h3>
                  <strong style={{ fontSize: 12, textTransform: 'uppercase' }}>{scheme.category}</strong>
                  <p style={{ marginBottom: 0 }}>{scheme.description}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>{t('villages')}</h2>

        {villagesLoading && <div>{t('loadingVillages')}</div>}
        {villagesError && <div style={{ color: 'red' }}>Error: {villagesError}</div>}

        {!villagesLoading && !villagesError && (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Block</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>District</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Population</th>
              </tr>
            </thead>
            <tbody>
              {villages.map((v) => (
                <tr key={v.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{v.name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{v.block}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{v.district}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>{v.population?.toLocaleString?.() ?? v.population}</td>
                </tr>
              ))}
              {villages.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 8 }}>{t('noVillages')}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>{t('grievance')}</h2>
        <form onSubmit={submitGrievance}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <label style={{ flex: 1, minWidth: 220 }}>
              {t('yourName')}<br />
              <input name="name" value={grievanceForm.name} onChange={(e) => setGrievanceForm({ ...grievanceForm, name: e.target.value })} placeholder={t('namePlaceholder')} style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </label>
            <label style={{ flex: 1, minWidth: 180 }}>
              {t('category')}<br />
              <select name="category" value={grievanceForm.category} onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })} style={{ width: '100%', padding: 8 }}>
                {['water', 'electricity', 'road', 'health', 'education', 'other'].map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          </div>
          <label>
            {t('describeIssue')}<br />
            <textarea name="issue" value={grievanceForm.issue} onChange={(e) => setGrievanceForm({ ...grievanceForm, issue: e.target.value })} placeholder={t('issuePlaceholder')} rows={4} style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
          </label>
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={grievanceSubmitting} style={{ padding: '8px 12px' }}>
              {grievanceSubmitting ? t('submitting') : t('submitGrievance')}
            </button>
            {grievanceStatus && <span style={{ marginLeft: 12, color: grievanceStatus.type === 'success' ? 'green' : 'red' }}>{grievanceStatus.message}</span>}
          </div>
        </form>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 8 }}>Create Alert</h2>

        <form onSubmit={async (e) => {
          e.preventDefault()
          setSubmitMessage(null)
          setFormErrors({})

          // validation
          const errors = {}
          if (!form.village_id) errors.village_id = 'Village is required'
          if (!form.category) errors.category = 'Category is required'
          if (!form.description || form.description.trim().length < 10) errors.description = 'Description must be at least 10 characters'
          if (!form.severity) form.severity = 'medium'

          if (Object.keys(errors).length) {
            setFormErrors(errors)
            return
          }

          setSubmitting(true)
          try {
            const payload = {
              village_id: Number(form.village_id),
              category: form.category,
              description: form.description,
              severity: form.severity || 'medium'
            }
            const res = await fetch(`${API_BASE}/api/alerts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            if (!res.ok) {
              const errJson = await res.json().catch(() => null)
              throw new Error(errJson?.error || 'Failed to create alert')
            }
            const data = await res.json()
            setSubmitMessage('Alert submitted successfully')
            setForm({ village_id: '', category: 'other', description: '', severity: 'medium' })
            fetchAlerts()
          } catch (err) {
            setSubmitMessage(err.message || 'Submit failed')
          } finally {
            setSubmitting(false)
            setTimeout(() => setSubmitMessage(null), 3000)
          }
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 2 }}>
              <label>Village</label><br />
              <select required value={form.village_id} onChange={(e) => { setForm({ ...form, village_id: e.target.value }); setFormErrors(prev => ({ ...prev, village_id: undefined })) }} style={{ width: '100%', padding: 6 }}>
                <option value="">Select village</option>
                {villages.map(v => <option key={v.id} value={v.id}>{v.name} — {v.district}</option>)}
              </select>
              {formErrors.village_id && <div style={{ color: 'red', marginTop: 4 }}>{formErrors.village_id}</div>}
            </div>

            <div style={{ flex: 1 }}>
              <label>Category</label><br />
              <select value={form.category} onChange={(e) => { setForm({ ...form, category: e.target.value }); setFormErrors(prev => ({ ...prev, category: undefined })) }} style={{ width: '100%', padding: 6 }}>
                <option value="water">Water</option>
                <option value="health">Health</option>
                <option value="crop">Crop</option>
                <option value="road">Road</option>
                <option value="other">Other</option>
              </select>
              {formErrors.category && <div style={{ color: 'red', marginTop: 4 }}>{formErrors.category}</div>}
            </div>

            <div style={{ flex: 1 }}>
              <label>Severity</label><br />
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} style={{ width: '100%', padding: 6 }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>Description</label><br />
            <textarea value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setFormErrors(prev => ({ ...prev, description: undefined })) }} rows={3} style={{ width: '100%', padding: 8 }} />
            {formErrors.description && <div style={{ color: 'red', marginTop: 4 }}>{formErrors.description}</div>}
          </div>

          <div>
            <button type="submit" disabled={submitting} style={{ padding: '8px 12px' }}>{submitting ? 'Submitting...' : 'Submit Alert'}</button>
            {submitMessage && <span style={{ marginLeft: 12 }}>{submitMessage}</span>}
          </div>
        </form>
      </section>

      <section>
        <h2 style={{ marginBottom: 8 }}>Alerts</h2>

        {alertsLoading && <div>Loading alerts...</div>}
        {alertsError && <div style={{ color: 'red' }}>Error: {alertsError}</div>}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div>
            <label>District</label><br />
            <select disabled={villagesLoading} value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} style={{ padding: 6 }}>
              <option value="">All</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label>Category</label><br />
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={{ padding: 6 }}>
              <option value="">All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Severity</label><br />
            <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} style={{ padding: 6 }}>
              <option value="">All</option>
              {severities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label>Status</label><br />
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ padding: 6 }}>
              <option value="">All</option>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="button" onClick={() => setFilters({ district: '', category: '', severity: '', status: '' })} style={{ padding: '6px 8px' }}>Clear</button>
          </div>
        </div>

        {!alertsLoading && !alertsError && (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Village</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Category</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Description</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Severity</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {alerts
                .filter(a => {
                  // get district from villages list
                  const v = villages.find(x => x.id === a.village_id)
                  if (filters.district && (!v || v.district !== filters.district)) return false
                  if (filters.category && a.category !== filters.category) return false
                  if (filters.severity && a.severity !== filters.severity) return false
                  if (filters.status && a.status !== filters.status) return false
                  return true
                })
                .map(a => (
                <tr key={a.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.village_name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.category}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.description}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.severity}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{a.status}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>
                        <select value={a.status} onChange={async (e) => {
                          const newStatus = e.target.value
                          // optimistic update
                          const old = alerts
                          setAlerts(current => current.map(x => x.id === a.id ? { ...x, status: newStatus } : x))
                          try {
                            const res = await fetch(`${API_BASE}/api/alerts/${a.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus })
                            })
                            if (!res.ok) throw new Error('Update failed')
                            const json = await res.json()
                            // replace with server value
                            setAlerts(current => current.map(x => x.id === a.id ? json.data : x))
                          } catch (err) {
                            // rollback on error
                            setAlerts(old)
                            alert('Failed to update status')
                          }
                        }}>
                          <option value="pending">pending</option>
                          <option value="in-progress">in-progress</option>
                          <option value="resolved">resolved</option>
                        </select>
                      </td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f0f0f0' }}>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {alerts.filter(a => {
                const v = villages.find(x => x.id === a.village_id)
                if (filters.district && (!v || v.district !== filters.district)) return false
                if (filters.category && a.category !== filters.category) return false
                if (filters.severity && a.severity !== filters.severity) return false
                if (filters.status && a.status !== filters.status) return false
                return true
              }).length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 8 }}>No alerts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
