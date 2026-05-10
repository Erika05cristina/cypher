"use client"

import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const EXPLORER = 'https://explorer.solana.com/tx'
const CLUSTER  = '?cluster=devnet'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const severityConfig: Record<string, any> = {
  LOW:      { label: 'LOW',      color: '#a855f7', emoji: '🟣' },
  MEDIUM:   { label: 'MEDIUM',   color: '#f7931e', emoji: '🟠' },
  CRITICAL: { label: 'CRITICAL', color: '#f4501e', emoji: '🔴' },
}

function scoreColor(score: number) {
  if (score <= 25) return '#a855f7'
  if (score <= 60) return '#f7931e'
  return '#f4501e'
}

function scoreArc(score: number, r = 58) {
  const circ = 2 * Math.PI * r
  return circ - (score / 100) * circ
}

// ─── ScoreRing ────────────────────────────────────────────────────────────────
function ScoreRing({ score, severity }: { score: number; severity: string }) {
  const R    = 58
  const circ = 2 * Math.PI * R
  const cfg  = severityConfig[severity] || severityConfig['LOW']
  return (
    <div className="score-ring">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#2a1f3d" strokeWidth="10" />
        <circle cx="80" cy="80" r={R} fill="none"
          stroke={scoreColor(score)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={scoreArc(score)}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${scoreColor(score)})` }}
        />
      </svg>
      <div className="score-number">
        <span style={{ fontSize: '2rem', fontWeight: 700, color: scoreColor(score), lineHeight: 1, filter: `drop-shadow(0 0 6px ${scoreColor(score)})` }}>
          {score}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#7a6b8a', letterSpacing: '0.1em', marginTop: 2 }}>/ 100</span>
        <span style={{ fontSize: '0.6rem', marginTop: 4, color: cfg.color, fontWeight: 700, letterSpacing: '0.15em' }}>
          {cfg.emoji} {severity}
        </span>
      </div>
    </div>
  )
}

// ─── SimulationPanel ──────────────────────────────────────────────────────────
function SimulationPanel({ sim }: { sim: any }) {
  const [open, setOpen] = useState(false)
  const success = sim?.success === true

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${success ? '#22c55e44' : '#f4501e44'}`,
      background: success ? 'rgba(34,197,94,0.06)' : 'rgba(244,80,30,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', cursor: 'pointer', background: 'transparent', border: 'none',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: success ? 'rgba(34,197,94,0.15)' : 'rgba(244,80,30,0.15)',
          border: `1px solid ${success ? '#22c55e44' : '#f4501e44'}`,
        }}>
          <FlaskConical size={18} color={success ? '#22c55e' : '#f4501e'} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: success ? '#22c55e' : '#f4501e', fontWeight: 700 }}>
              SimulationSuccessRule
            </span>
            <span style={{
              fontSize: '0.6rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.1em',
              background: success ? 'rgba(34,197,94,0.1)' : 'rgba(244,80,30,0.1)',
              border: `1px solid ${success ? '#22c55e55' : '#f4501e55'}`,
              color: success ? '#22c55e' : '#f4501e',
            }}>
              {success ? 'PASSED ✓' : 'FAILED ✗ +20 pts'}
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#c4b5d4', marginTop: 4 }}>
            {success
              ? 'Transaction simulation completed successfully — no hidden blocks detected.'
              : `Simulation reverted: "${sim?.error ?? 'Unknown error'}" — possible honeypot or hidden transfer restriction.`}
          </p>
        </div>
        <span style={{ color: '#7a6b8a', flexShrink: 0 }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expandable logs */}
      {open && sim?.logs && sim.logs.length > 0 && (
        <div style={{ padding: '0 18px 14px 18px' }}>
          <p style={{ fontSize: '0.65rem', color: '#7a6b8a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Execution Logs
          </p>
          <div className="font-mono" style={{
            fontSize: '0.7rem', color: '#e2d4f0', background: '#0c0a0f',
            border: '1px solid #2a1f3d', borderRadius: 8, padding: 12,
            maxHeight: 180, overflowY: 'auto', lineHeight: 1.8,
          }}>
            {sim.logs.map((log: string, i: number) => (
              <div key={i} style={{ color: log.includes('failed') || log.includes('error') ? '#f4501e' : '#e2d4f0' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FlagCard ─────────────────────────────────────────────────────────────────
function FlagCard({ flag, index }: { flag: any; index: number }) {
  const [open, setOpen] = useState(false)
  const chipClass = flag.severity >= 35 ? 'chip-critical' : flag.severity >= 20 ? 'chip-medium' : 'chip-low'
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: flag.severity >= 35 ? '#f4501e18' : '#f7931e18',
          border: `1px solid ${flag.severity >= 35 ? '#f4501e44' : '#f7931e44'}`,
        }}>
          <span style={{ fontSize: '1.1rem' }}>
            {flag.severity >= 35 ? '🚨' : flag.severity >= 20 ? '⚠️' : '💡'}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: '#f72585', fontWeight: 600, wordBreak: 'break-all' }}>
              {flag.rule}
            </span>
            <span className={chipClass} style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.1em' }}>
              +{flag.severity} pts
            </span>
          </div>
          {open && <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#c4b5d4', lineHeight: 1.6 }}>{flag.description}</p>}
        </div>
        <span style={{ color: '#7a6b8a', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '0.8rem' }}>▾</span>
      </div>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #2a1f3d', borderTopColor: '#f72585' }} className="animate-spin" />
      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#7a6b8a', letterSpacing: '0.15em' }}>ANALYZING...</span>
    </div>
  )
}

// ─── ResultPanel ──────────────────────────────────────────────────────────────
function ResultPanel({ result }: { result: any }) {
  const cfg = severityConfig[result.severity] || severityConfig['LOW']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Score card */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <ScoreRing score={result.score} severity={result.severity} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
              <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 700, letterSpacing: '0.15em' }}>{cfg.label} RISK</span>
            </div>
            <p className="font-mono" style={{ fontSize: '0.7rem', color: '#7a6b8a', wordBreak: 'break-all', marginBottom: 12 }}>{result.address}</p>
            <div style={{ height: 6, background: '#2a1f3d', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', width: `${result.score}%`, background: `linear-gradient(90deg, #7b2fbe, ${scoreColor(result.score)})`, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 8px ${scoreColor(result.score)}88` }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#f7258518', border: '1px solid #f7258533', color: '#ffd6ec', fontSize: '0.7rem', padding: '3px 10px', borderRadius: 99 }}>
                {result.flags.length} risk signal{result.flags.length !== 1 ? 's' : ''} detected
              </span>
              {result.simulation && (
                <span style={{ background: result.simulation.success ? 'rgba(34,197,94,0.1)' : 'rgba(244,80,30,0.1)', border: `1px solid ${result.simulation.success ? '#22c55e44' : '#f4501e44'}`, color: result.simulation.success ? '#22c55e' : '#f4501e', fontSize: '0.7rem', padding: '3px 10px', borderRadius: 99 }}>
                  🧪 Sim: {result.simulation.success ? 'PASSED' : 'FAILED'}
                </span>
              )}
              {result.tx_signature && !result.tx_signature.startsWith('Error') && (
                <a href={`${EXPLORER}/${result.tx_signature}${CLUSTER}`} target="_blank" rel="noreferrer"
                  style={{ background: '#7b2fbe18', border: '1px solid #7b2fbe44', color: '#c084fc', fontSize: '0.7rem', padding: '3px 10px', borderRadius: 99, textDecoration: 'none' }}>
                  ⛓ View on Solana Explorer →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Risk flags section */}
      {result.flags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: '#7a6b8a', letterSpacing: '0.12em', textTransform: 'uppercase', paddingLeft: 4 }}>
            Detected risk signals
          </span>
          {result.flags.map((flag: any, i: number) => (
            <FlagCard key={flag.rule} flag={flag} index={i} />
          ))}
        </div>
      )}

      {/* No flags at all */}
      {result.flags.length === 0 && !result.simulation && (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <p style={{ color: '#a855f7', fontWeight: 600 }}>No risk signals detected</p>
          <p style={{ fontSize: '0.8rem', color: '#7a6b8a', marginTop: 4 }}>This token appears clean according to our analysis rules.</p>
        </div>
      )}

      {/* AI Analysis */}
      <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #15101e 0%, #1a0d2e 100%)', border: '1px solid #f7258530' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg, #f72585, #7b2fbe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🤖</div>
            <span style={{ fontSize: '0.75rem', color: '#ffd6ec', fontWeight: 700, letterSpacing: '0.1em' }}>ARTIFICIAL INTELLIGENCE ANALYSIS</span>
          </div>
          {result.ai_provider && (
            <span style={{ fontSize: '0.6rem', padding: '3px 10px', borderRadius: 99, background: '#f7258514', border: '1px solid #f7258530', color: '#f72585', fontWeight: 600 }}>
              via {result.ai_provider}
            </span>
          )}
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(247,37,133,0.3), transparent)', marginBottom: 16 }} />
        <div style={{ fontSize: '0.875rem', color: '#e2d4f0', lineHeight: 1.8, wordBreak: 'break-word' }}>
          {result.ai_explanation
            ? <ReactMarkdown>{result.ai_explanation}</ReactMarkdown>
            : <span style={{ color: '#7a6b8a', fontStyle: 'italic' }}>Configuring AI... Add API keys in the backend .env.</span>
          }
        </div>
      </div>

      {/* TX signature */}
      {result.tx_signature && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.65rem', color: '#7a6b8a', letterSpacing: '0.1em', flexShrink: 0 }}>TX</span>
            <span className="font-mono" style={{ fontSize: '0.65rem', color: result.tx_signature.startsWith('Error') ? '#f4501e' : '#c084fc', wordBreak: 'break-all' }}>
              {result.tx_signature}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ScannerView ──────────────────────────────────────────────────────────────
export function ScannerView() {
  const [address, setAddress]   = useState('')
  const [txBase64, setTxBase64] = useState('')
  const [showSimField, setShowSimField] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState<any>(null)
  const [error, setError]       = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAnalyze = async () => {
    const addr = address.trim()
    if (!addr) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const body: any = { address: addr }
      if (txBase64.trim()) body.tx_base64 = txBase64.trim()

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis Error')
      }
      setResult(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  return (
    <div className="max-w-3xl mx-auto pt-32 pb-32 px-4">
      <Link href="/" className="inline-flex items-center gap-2 mb-8 text-sm" style={{ color: '#7a6b8a', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Landing
      </Link>

      <header style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Audit Engine</h2>
        <p style={{ color: '#7a6b8a', fontSize: '1rem', marginTop: 12 }}>Paste a Solana token address below to scan.</p>
      </header>

      <div className="glass" style={{ padding: 32, borderRadius: 24, marginBottom: 32 }}>
        {/* Token address */}
        <label className="font-mono" style={{ display: 'block', fontSize: '0.75rem', color: '#f72585', fontWeight: 700, letterSpacing: '0.15em', marginBottom: 12, textTransform: 'uppercase' }}>
          Token / Contract Address
        </label>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            ref={inputRef}
            type="text"
            className="input-cypher"
            placeholder="So11111111111111111111111111111111111111112"
            value={address}
            onChange={e => setAddress(e.target.value)}
            onKeyDown={handleKey}
            style={{ flex: 1, padding: '16px 20px', borderRadius: 12, fontSize: '0.9rem', width: '100%' }}
          />
          <button
            className="btn-primary-custom"
            onClick={handleAnalyze}
            disabled={loading || !address.trim()}
            style={{ padding: '16px 32px', borderRadius: 12, fontSize: '1rem', whiteSpace: 'nowrap' }}
          >
            <span>{loading ? 'EXECUTING...' : 'ANALYZE TX'}</span>
          </button>
        </div>

        {/* Quick test buttons */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="font-mono" style={{ fontSize: '0.7rem', color: '#7a6b8a' }}>QUICK TEST:</span>
          {[
            { label: 'Wrapped SOL', addr: 'So11111111111111111111111111111111111111112' },
            { label: 'USDC',        addr: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
          ].map(({ label, addr }) => (
            <button key={addr} onClick={() => setAddress(addr)}
              style={{ fontSize: '0.7rem', padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid #2a1f3d', color: '#ffd6ec', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f72585'; e.currentTarget.style.background = 'rgba(247,37,133,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a1f3d'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Simulation section */}
        <div style={{ marginTop: 20, borderTop: '1px solid #2a1f3d', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <FlaskConical size={15} color="#7b2fbe" />
            <span className="font-mono" style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 600, letterSpacing: '0.1em' }}>
              TRANSACTION SIMULATION
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99, background: 'rgba(123,47,190,0.1)', border: '1px solid rgba(123,47,190,0.3)', color: '#c084fc', fontWeight: 700 }}>
              OPTIONAL
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#7a6b8a', lineHeight: 1.5, marginBottom: 10 }}>
            Provide a base64-encoded transaction to simulate a buy/sell on-chain and detect hidden honeypot traps.
          </p>

          {/* Advanced: manual tx override */}
          <button
            onClick={() => setShowSimField(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: '0.65rem', color: '#7a6b8a', letterSpacing: '0.08em' }}>
              {showSimField ? '▲' : '▶'} Advanced: use custom transaction
            </span>
          </button>

          {showSimField && (
            <div style={{ marginTop: 10 }}>
              <textarea
                className="input-cypher"
                placeholder="Optional: paste base64-encoded raw transaction bytes to override auto-simulation..."
                value={txBase64}
                onChange={e => setTxBase64(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: '0.78rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner />
        </div>
      )}
      {error && (
        <div className="card chip-critical" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start', borderRadius: 16 }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🚨</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#f4501e' }}>Execution Error</p>
            <p className="font-mono" style={{ fontSize: '0.85rem', color: '#f4501eaa', marginTop: 8 }}>{error}</p>
          </div>
        </div>
      )}
      {!loading && result && <ResultPanel result={result} />}
    </div>
  )
}
