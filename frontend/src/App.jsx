import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import cypherLogo from './assets/cypher-logo.svg'
import './index.css'

// ─── Constantes ──────────────────────────────────────────────────────────────
const API_URL = 'http://localhost:8000'
const EXPLORER = 'https://explorer.solana.com/tx'
const CLUSTER  = '?cluster=devnet'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const severityConfig = {
  LOW:      { label: 'LOW',      color: '#a855f7', bg: '#7b2fbe18', border: '#7b2fbe55', emoji: '🟣' },
  MEDIUM:   { label: 'MEDIUM',   color: '#f7931e', bg: '#f7931e18', border: '#f7931e55', emoji: '🟠' },
  CRITICAL: { label: 'CRITICAL', color: '#f4501e', bg: '#f4501e18', border: '#f4501e55', emoji: '🔴' },
}

function scoreColor(score) {
  if (score <= 25)  return '#a855f7'
  if (score <= 60)  return '#f7931e'
  return '#f4501e'
}

function scoreArc(score, r = 58) {
  const circ = 2 * Math.PI * r
  return circ - (score / 100) * circ
}

// ─── Componente: Score Ring ────────────────────────────────────────────────
function ScoreRing({ score, severity }) {
  const R    = 58
  const circ = 2 * Math.PI * R
  const cfg  = severityConfig[severity] || severityConfig['LOW']

  return (
    <div className="score-ring">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Track */}
        <circle cx="80" cy="80" r={R}
          fill="none" stroke="#2a1f3d" strokeWidth="10" />
        {/* Progress */}
        <circle cx="80" cy="80" r={R}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={scoreArc(score)}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease',
                   filter: `drop-shadow(0 0 8px ${scoreColor(score)})` }}
        />
      </svg>
      <div className="score-number">
        <span style={{ fontSize: '2rem', fontWeight: 700, color: scoreColor(score),
                       lineHeight: 1, filter: `drop-shadow(0 0 6px ${scoreColor(score)})` }}>
          {score}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: 2 }}>
          / 100
        </span>
        <span style={{ fontSize: '0.6rem', marginTop: 4, color: cfg.color,
                       fontWeight: 700, letterSpacing: '0.15em' }}>
          {cfg.emoji} {severity}
        </span>
      </div>
    </div>
  )
}

// ─── Componente: Flag Card ─────────────────────────────────────────────────
function FlagCard({ flag, index }) {
  const [open, setOpen] = useState(false)

  const chipClass = flag.severity >= 35 ? 'chip-critical'
                  : flag.severity >= 20 ? 'chip-medium'
                  : 'chip-low'

  const sev = flag.severity >= 35 ? 'CRITICAL' : flag.severity >= 20 ? 'MEDIUM' : 'LOW'

  return (
    <div className="card animate-pop"
      style={{ animationDelay: `${index * 80}ms`, opacity: 0,
               animationFillMode: 'forwards', cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ padding: '14px 18px', display: 'flex',
                    alignItems: 'center', gap: 12 }}>
        {/* Ícono */}
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: flag.severity >= 35 ? '#f4501e18' : '#f7931e18',
                      border: `1px solid ${flag.severity >= 35 ? '#f4501e44' : '#f7931e44'}` }}>
          <span style={{ fontSize: '1.1rem' }}>
            {flag.severity >= 35 ? '🚨' : flag.severity >= 20 ? '⚠️' : '💡'}
          </span>
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--pink)',
                                             fontWeight: 600, wordBreak: 'break-all' }}>
              {flag.rule}
            </span>
            <span className={chipClass}
              style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 99,
                       fontWeight: 700, letterSpacing: '0.1em' }}>
              +{flag.severity} pts
            </span>
          </div>
          {open && (
            <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#c4b5d4',
                        lineHeight: 1.6 }}>
              {flag.description}
            </p>
          )}
        </div>

        {/* Chevron */}
        <span style={{ color: 'var(--muted)', transition: 'transform 0.2s',
                       transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                       fontSize: '0.8rem' }}>▾</span>
      </div>
    </div>
  )
}

// ─── Componente: Loader ────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid var(--border)',
                    borderTopColor: 'var(--pink)',
                    animation: 'spin 0.8s linear infinite' }} />
      <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)',
                                       letterSpacing: '0.15em', animation: 'glowPulse 2s infinite' }}>
        ANALYZING...
      </span>
    </div>
  )
}

// ─── Componente: Result Panel ──────────────────────────────────────────────
function ResultPanel({ result }) {
  const cfg = severityConfig[result.severity] || severityConfig['LOW']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
         className="animate-fade-up">

      {/* Header del reporte */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <ScoreRing score={result.score} severity={result.severity} />

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                            background: cfg.color,
                            boxShadow: `0 0 8px ${cfg.color}` }} />
              <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 700,
                              letterSpacing: '0.15em' }}>
                {cfg.label} RISK
              </span>
            </div>

            <p className="mono" style={{ fontSize: '0.7rem', color: 'var(--muted)',
                                          wordBreak: 'break-all', marginBottom: 12 }}>
              {result.address}
            </p>

            {/* Barra de severidad visual */}
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3,
                          overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%',
                width: `${result.score}%`,
                background: `linear-gradient(90deg, var(--violet), ${scoreColor(result.score)})`,
                borderRadius: 3,
                transition: 'width 1s ease',
                boxShadow: `0 0 8px ${scoreColor(result.score)}88`,
              }} />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#f7258518', border: '1px solid #f7258533',
                              color: 'var(--soft)', fontSize: '0.7rem',
                              padding: '3px 10px', borderRadius: 99 }}>
                {result.flags.length} risk signal{result.flags.length !== 1 ? 's' : ''} detected
              </span>

              {result.tx_signature && !result.tx_signature.startsWith('Error') && (
                <a href={`${EXPLORER}/${result.tx_signature}${CLUSTER}`}
                   target="_blank" rel="noreferrer"
                   style={{ background: '#7b2fbe18', border: '1px solid #7b2fbe44',
                             color: '#c084fc', fontSize: '0.7rem',
                             padding: '3px 10px', borderRadius: 99,
                             textDecoration: 'none', transition: 'background 0.2s' }}>
                  ⛓ View on Solana Explorer →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flags */}
      {result.flags.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)',
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          paddingLeft: 4 }}>
            Detected risk signals
          </span>
          {result.flags.map((flag, i) => (
            <FlagCard key={flag.rule} flag={flag} index={i} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <p style={{ color: '#a855f7', fontWeight: 600 }}>
            No risk signals detected
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 4 }}>
            This token appears clean according to our analysis rules.
          </p>
        </div>
      )}

      {/* ── AI Explanation Card ────────────────────────────────────────────── */}
      <div className="card animate-pop"
        style={{ padding: 24, animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards',
                  background: 'linear-gradient(135deg, #15101e 0%, #1a0d2e 100%)',
                  border: '1px solid #f7258530' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                           background: 'linear-gradient(135deg, var(--pink), var(--violet))',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           fontSize: '0.85rem' }}>
              🤖
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--soft)',
                            fontWeight: 700, letterSpacing: '0.1em' }}>
              ARTIFICIAL INTELLIGENCE ANALYSIS
            </span>
          </div>
          {result.ai_provider && (
            <span style={{ fontSize: '0.6rem', padding: '3px 10px', borderRadius: 99,
                            background: '#f7258514', border: '1px solid #f7258530',
                            color: 'var(--pink)', fontWeight: 600 }}>
              via {result.ai_provider}
            </span>
          )}
        </div>

        {/* Línea separadora con gradiente */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, var(--pink)44, transparent)',
                       marginBottom: 16 }} />

        {/* Respuesta del LLM */}
        <div className="markdown-body" style={{ fontSize: '0.875rem', color: '#e2d4f0', lineHeight: 1.8,
                       wordBreak: 'break-word' }}>
          {result.ai_explanation ? (
            <ReactMarkdown>{result.ai_explanation}</ReactMarkdown>
          ) : (
            <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              Configuring AI... Add GOOGLE_API_KEY or GROQ_API_KEY in the .env to enable this feature.
            </span>
          )}
        </div>

        {/* Raw prompt colapsable */}
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: '0.65rem', color: 'var(--muted)', cursor: 'pointer',
                             letterSpacing: '0.08em', userSelect: 'none' }}>
            View raw technical prompt sent to the LLM
          </summary>
          <pre style={{ marginTop: 8, fontSize: '0.6rem', color: 'var(--muted)', lineHeight: 1.6,
                         whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                         background: '#0c0a0f', padding: 12, borderRadius: 8,
                         border: '1px solid var(--border)', maxHeight: 180, overflowY: 'auto' }}>
            {result.ai_prompt}
          </pre>
        </details>
      </div>


      {/* TX signature */}
      {result.tx_signature && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)',
                            letterSpacing: '0.1em', flexShrink: 0 }}>TX</span>
            <span className="mono"
              style={{ fontSize: '0.65rem',
                       color: result.tx_signature.startsWith('Error') ? '#f4501e' : '#c084fc',
                       wordBreak: 'break-all' }}>
              {result.tx_signature}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────
export default function App() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)
  const inputRef = useRef(null)

  const handleAnalyze = async () => {
    const addr = address.trim()
    if (!addr) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Error desconocido')
      }
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleAnalyze() }

  return (
    <div className="noise grid-bg" style={{ minHeight: '100vh', position: 'relative' }}>

      {/* Blobs de fondo */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%',
                    width: 500, height: 500, borderRadius: '50%',
                    background: 'radial-gradient(circle, #f7258512 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-10%', left: '-5%',
                    width: 400, height: 400, borderRadius: '50%',
                    background: 'radial-gradient(circle, #7b2fbe14 0%, transparent 70%)',
                    pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1,
                    maxWidth: 680, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <header style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Logo / wordmark */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12,
                         marginBottom: 20 }}>
            <img src={cypherLogo} alt="Cypher Logo" style={{ width: 50, height: 50, filter: 'drop-shadow(0 0 10px #f7258540)' }} />
            <h1 className="gradient-text" style={{ fontSize: '2.4rem', fontWeight: 800,
                                                     letterSpacing: '-0.02em', lineHeight: 1 }}>
              CYPHER
            </h1>
          </div>

          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', maxWidth: 420,
                       margin: '0 auto', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--soft)' }}>Forensic auditing system</span> for Solana tokens. 
            Detect rug-pulls, honeypots, and scams before you lose your money.
          </p>

          {/* Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8,
                         flexWrap: 'wrap', marginTop: 16 }}>
            {['Devnet', '4 Active Rules', 'On-Chain Registry', 'Dev3Pack'].map(b => (
              <span key={b} style={{ fontSize: '0.65rem', padding: '3px 10px',
                                      borderRadius: 99, border: '1px solid var(--border)',
                                      color: 'var(--muted)', background: '#15101e' }}>
                {b}
              </span>
            ))}
          </div>
        </header>

        {/* ── SEARCH BAR ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--pink)',
                           fontWeight: 700, letterSpacing: '0.15em',
                           marginBottom: 8, textTransform: 'uppercase' }}>
            Token / Contract Address
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              id="address-input"
              type="text"
              className="input-cypher"
              placeholder="So11111111111111111111111111111111111111112"
              value={address}
              onChange={e => setAddress(e.target.value)}
              onKeyDown={handleKey}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 10,
                        fontSize: '0.8rem' }}
            />
            <button
              id="analyze-btn"
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={loading || !address.trim()}
              style={{ padding: '12px 24px', borderRadius: 10, fontSize: '0.85rem',
                        fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
            >
              <span>{loading ? '...' : 'Analyze'}</span>
            </button>
          </div>

          {/* Quick test addresses */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center',
                         gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Try:</span>
            {[
              { label: 'Wrapped SOL', addr: 'So11111111111111111111111111111111111111112' },
              { label: 'USDC', addr: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
            ].map(({ label, addr }) => (
              <button key={addr}
                onClick={() => setAddress(addr)}
                style={{ fontSize: '0.65rem', padding: '3px 10px', borderRadius: 99,
                          background: 'transparent', border: '1px solid var(--border)',
                          color: 'var(--muted)', cursor: 'pointer',
                          transition: 'border-color 0.2s, color 0.2s',
                          fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pink)'; e.currentTarget.style.color = 'var(--soft)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── ESTADOS ──────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Spinner />
          </div>
        )}

        {error && (
          <div className="card chip-critical animate-fade-up"
            style={{ padding: '16px 20px', display: 'flex', gap: 12,
                      alignItems: 'flex-start', borderRadius: 12 }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🚨</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f4501e' }}>
                Analysis Error
              </p>
              <p style={{ fontSize: '0.8rem', color: '#f4501eaa', marginTop: 4 }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {!loading && result && <ResultPanel result={result} />}

        {/* ── EMPTY STATE ──────────────────────────────────────────────── */}
        {!loading && !result && !error && (
          <div style={{ textAlign: 'center', padding: '48px 0', opacity: 0.5 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
            <p className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted)',
                                          letterSpacing: '0.1em' }}>
              ENTER AN ADDRESS TO BEGIN
            </p>
          </div>
        )}

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{ marginTop: 80, textAlign: 'center',
                          borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
            <span className="gradient-text" style={{ fontWeight: 700 }}>CYPHER</span>
            {' '}· Hackathon Dev3Pack ·{' '}
            <span style={{ color: 'var(--pink)' }}>"Don't trust. Verify."</span>
          </p>
        </footer>
      </div>
    </div>
  )
}
