import React, { useEffect, useRef, useState } from 'react'
import { useLanguage } from './LanguageContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const mapPositions = [
  { x: 18, y: 30 },
  { x: 39, y: 61 },
  { x: 57, y: 27 },
  { x: 73, y: 68 },
  { x: 84, y: 39 }
]

const riskStyles = {
  critical: { color: '#c83b3b', label: 'Critical' },
  high: { color: '#d66a2c', label: 'High' },
  medium: { color: '#c49521', label: 'Medium' },
  low: { color: '#3b8a5a', label: 'Low' }
}

function RiskMap({ villages, alerts }) {
  const [selectedVillageId, setSelectedVillageId] = useState(null)

  const mapVillages = villages.map((village, index) => {
    const villageAlerts = alerts
      .filter(alert => alert.village_id === village.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    const latestAlert = villageAlerts[0]
    const risk = latestAlert?.severity || 'low'

    return {
      ...village,
      ...mapPositions[index % mapPositions.length],
      risk,
      latestAlert
    }
  })

  const selectedVillage = mapVillages.find(village => village.id === selectedVillageId)

  return (
    <section className="panel risk-map-panel">
      <div className="risk-map-heading">
        <div>
          <p className="eyebrow risk-map-eyebrow">FIELD INTELLIGENCE</p>
          <h2>Village risk map</h2>
        </div>
        <span className="risk-map-count">{mapVillages.length} villages tracked</span>
      </div>

      <div className="risk-map-layout">
        <div className="risk-map-canvas" aria-label="Illustrative village risk map">
          <svg viewBox="0 0 100 100" role="img" aria-labelledby="risk-map-title">
            <title id="risk-map-title">Village risk levels</title>
            <path className="map-river" d="M7 6 C27 25 18 39 36 50 S55 69 45 96" />
            <path className="map-road" d="M4 78 C24 66 38 72 50 47 S74 22 96 15" />
            <path className="map-road map-road-secondary" d="M18 14 C32 30 49 33 66 50 S80 77 94 86" />
            {mapVillages.map(village => {
              const style = riskStyles[village.risk] || riskStyles.low
              const isSelected = selectedVillageId === village.id
              return (
                <g
                  key={village.id}
                  className={`map-marker ${isSelected ? 'selected' : ''}`}
                  transform={`translate(${village.x} ${village.y})`}
                  onClick={() => setSelectedVillageId(village.id)}
                  tabIndex="0"
                  role="button"
                  aria-label={`${village.name}, ${style.label} risk`}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedVillageId(village.id) }}
                >
                  <circle className="marker-pulse" r="5" fill={style.color} />
                  <circle className="marker-dot" r="2.3" fill={style.color} />
                  <text x="5" y="1" className="marker-label">{village.name}</text>
                </g>
              )
            })}
          </svg>
          <div className="risk-legend">
            {Object.entries(riskStyles).map(([risk, style]) => (
              <span key={risk}><i style={{ backgroundColor: style.color }} />{style.label}</span>
            ))}
          </div>
        </div>

        <div className="risk-village-list">
          <h3>Village watchlist</h3>
          {mapVillages.map(village => {
            const style = riskStyles[village.risk] || riskStyles.low
            return (
              <button
                type="button"
                className={`risk-village ${selectedVillageId === village.id ? 'selected' : ''}`}
                key={village.id}
                onClick={() => setSelectedVillageId(village.id)}
              >
                <span className="risk-village-dot" style={{ backgroundColor: style.color }} />
                <span className="risk-village-copy">
                  <strong>{village.name}</strong>
                  <small>{village.latestAlert?.description || 'No active alerts'}</small>
                </span>
                <span className="risk-village-level" style={{ color: style.color }}>{style.label}</span>
              </button>
            )
          })}
          {selectedVillage && <p className="risk-map-note">Selected: {selectedVillage.name} · {selectedVillage.district}</p>}
          {mapVillages.length === 0 && <p className="risk-map-empty">Village data is still loading.</p>}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  const { lang, setLang, t } = useLanguage()
  const [healthStatus, setHealthStatus] = useState('loading')
  const [activeTab, setActiveTab] = useState('schemes')

  const [villages, setVillages] = useState([])
  const [villagesLoading, setVillagesLoading] = useState(true)
  const [villagesError, setVillagesError] = useState(null)
  
  const [alerts, setAlerts] = useState([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [alertsError, setAlertsError] = useState(null)

  const [grievances, setGrievances] = useState([])

  const [schemes, setSchemes] = useState([])
  const [schemesLoading, setSchemesLoading] = useState(true)
  const [schemesError, setSchemesError] = useState(null)
  const [schemeCategory, setSchemeCategory] = useState('all')

  const [assistantQuery, setAssistantQuery] = useState('')
  const [assistantAnswer, setAssistantAnswer] = useState(null)
  const [assistantLoading, setAssistantLoading] = useState(false)

  const [grievanceForm, setGrievanceForm] = useState({ name: '', category: 'water', issue: '' })
  const [grievanceMedia, setGrievanceMedia] = useState(null)
  const [grievancePreview, setGrievancePreview] = useState(null)
  const grievanceFileInput = useRef(null)
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
    fetch(`${API_BASE}/api/grievances`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load grievances')
        return res.json()
      })
      .then((data) => setGrievances(data?.data || []))
      .catch(() => setGrievances([]))
  }, [grievanceStatus])

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
      const payload = new FormData()
      payload.append('name', grievanceForm.name.trim())
      payload.append('issue', grievanceForm.issue.trim())
      payload.append('category', grievanceForm.category)
      if (grievanceMedia) payload.append('media', grievanceMedia)

      const response = await fetch(`${API_BASE}/api/grievances`, {
        method: 'POST',
        body: payload
      })
      if (!response.ok) throw new Error(t('submissionFailed'))
      setGrievanceForm({ name: '', category: 'water', issue: '' })
      setGrievanceMedia(null)
      setGrievancePreview(null)
      if (grievanceFileInput.current) grievanceFileInput.current.value = ''
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
  const pendingGrievances = grievances.filter(grievance => grievance.status === 'pending').length

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">RURAL SERVICES PLATFORM</p>
          <h1>{t('appTitle')}</h1>
          <p className="header-subtitle">Schemes, local support, and citizen voice in one place.</p>
        </div>
        <button className="language-toggle" type="button" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
          {lang === 'en' ? 'हिंदी' : 'English'}
        </button>
      </header>

      <div className="connection-status">
        <strong>{t('backend')} </strong>
        {healthStatus === 'loading' && <span>{t('checking')}</span>}
        {healthStatus === 'connected' && (
          <span style={{ color: 'green' }}>{t('connected')} ✅</span>
        )}
        {healthStatus === 'disconnected' && (
          <span style={{ color: 'red' }}>{t('disconnected')} ❌</span>
        )}
      </div>

      <div className="stats-bar">
        <div className="stat-card"><span className="stat-number">{villages.length}</span><span className="stat-label">Villages covered</span></div>
        <div className="stat-card"><span className="stat-number">{schemes.length}</span><span className="stat-label">Government schemes</span></div>
        <div className="stat-card"><span className="stat-number">{pendingGrievances}</span><span className="stat-label">Pending grievances</span></div>
        <div className="stat-card"><span className="stat-number">{alerts.length}</span><span className="stat-label">Community alerts</span></div>
      </div>

      <nav className="tab-nav" aria-label="Dashboard sections">
        {[
          ['schemes', 'Schemes'],
          ['assistant', 'Assistant'],
          ['grievance', 'File grievance'],
          ['riskmap', 'Risk Map'],
          ['operations', 'Operations']
        ].map(([tab, label]) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} type="button" onClick={() => setActiveTab(tab)}>
            {label}
          </button>
        ))}
      </nav>

      <main className="tab-content">

      {activeTab === 'assistant' && <section className="panel assistant-panel">
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
      </section>}

      {activeTab === 'schemes' && <>
      <section className="panel">
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
            <div className="scheme-list">
              {visibleSchemes.map(scheme => (
                <article className="scheme-card" key={scheme.id}>
                  <h3 style={{ margin: '0 0 6px' }}>{scheme.name}</h3>
                  <strong style={{ fontSize: 12, textTransform: 'uppercase' }}>{scheme.category}</strong>
                  <p style={{ marginBottom: 0 }}>{scheme.description}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel">
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
      </>}

      {activeTab === 'grievance' && <section className="panel grievance-form">
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
          <label style={{ display: 'block', marginTop: 8 }}>
            Attach photo or video (optional)<br />
            <input
              ref={grievanceFileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setGrievanceMedia(file)
                setGrievancePreview(URL.createObjectURL(file))
              }}
              style={{ marginTop: 6 }}
            />
          </label>
          {grievancePreview && grievanceMedia && (
            grievanceMedia.type.startsWith('video/')
              ? <video src={grievancePreview} controls style={{ display: 'block', maxWidth: 240, maxHeight: 180, borderRadius: 8, marginTop: 8 }} />
              : <img src={grievancePreview} alt="Selected evidence preview" style={{ display: 'block', maxWidth: 240, maxHeight: 180, objectFit: 'contain', borderRadius: 8, marginTop: 8 }} />
          )}
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={grievanceSubmitting} style={{ padding: '8px 12px' }}>
              {grievanceSubmitting ? t('submitting') : t('submitGrievance')}
            </button>
            {grievanceStatus && <span style={{ marginLeft: 12, color: grievanceStatus.type === 'success' ? 'green' : 'red' }}>{grievanceStatus.message}</span>}
          </div>
        </form>
        <div style={{ marginTop: 24 }}>
          <h3>Submitted grievances</h3>
          {grievances.length === 0 && <p>No grievances submitted yet.</p>}
          {grievances.map((grievance) => (
            <article key={grievance.id} style={{ borderTop: '1px solid #e5e7eb', padding: '12px 0' }}>
              <strong>{grievance.category || 'other'} · {grievance.status}</strong>
              <p style={{ margin: '6px 0' }}>{grievance.issue}</p>
              <small>Submitted by {grievance.name}</small>
              {grievance.media_path && (
                grievance.media_path.match(/\.(mp4|mov|avi)$/i)
                  ? <video src={`${API_BASE}${grievance.media_path}`} controls style={{ display: 'block', maxWidth: 200, maxHeight: 160, marginTop: 8 }} />
                  : <img src={`${API_BASE}${grievance.media_path}`} alt="Grievance evidence" style={{ display: 'block', maxWidth: 200, maxHeight: 160, objectFit: 'contain', borderRadius: 6, marginTop: 8 }} />
              )}
            </article>
          ))}
        </div>
      </section>}

      {activeTab === 'riskmap' && <RiskMap villages={villages} alerts={alerts} />}

      {activeTab === 'operations' && <>
      <section className="panel">
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

      <section className="panel">
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
      </>}
      </main>
    </div>
  )
}
