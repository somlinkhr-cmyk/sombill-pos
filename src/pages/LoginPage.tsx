import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, user } = useAuth()
  const [role, setRole] = useState('cashier')
  const [restaurantId, setRestaurantId] = useState('')
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')

  // Redirect to appropriate dashboard when user is logged in
  React.useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        manager: '/manager',
        cashier: '/cashier',
        waiter: '/waiter',
        kitchen: '/kitchen',
        customer: '/customer',
      }
      navigate(roleRoutes[user.role] || '/manager', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      // Use full email if provided, otherwise append @sombill.com
      const email = username.includes('@') ? username : `${username}@sombill.com`
      const password = pin.join('') || '1133'
      console.log('Attempting login with:', email, password)
      await login(email, password)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    }
  }

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newPin = [...pin]
      newPin[index] = value
      setPin(newPin)
      
      // Auto-advance to next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`) as HTMLInputElement
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`) as HTMLInputElement
      if (prevInput) prevInput.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{
      background: `
        radial-gradient(60% 55% at 15% 10%, rgba(143,184,214,.35), transparent 60%),
        radial-gradient(55% 50% at 90% 15%, rgba(217,220,224,.20), transparent 60%),
        radial-gradient(70% 65% at 50% 100%, rgba(94,45,168,.55), transparent 60%),
        linear-gradient(160deg, #2B0F73 0%, #1C0A54 55%, #12053B 100%)
      `
    }}>
      {/* Floating blurred orbs */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: '420px', height: '420px', background: '#8FB8D6', top: '-120px', left: '-100px',
        filter: 'blur(70px)', opacity: '0.55'
      }}></div>
      <div className="absolute rounded-full pointer-events-none" style={{
        width: '340px', height: '340px', background: '#6E9BB9', bottom: '-100px', right: '-60px',
        filter: 'blur(70px)', opacity: '0.35'
      }}></div>
      <div className="absolute rounded-full pointer-events-none" style={{
        width: '260px', height: '260px', background: '#D9DCE0', top: '35%', right: '12%',
        filter: 'blur(70px)', opacity: '0.15'
      }}></div>

      {/* Background ribbon watermark */}
      <svg className="absolute top-1/2 left-1/2 pointer-events-none" style={{
        width: '1100px', height: '1100px', transform: 'translate(-50%, -50%)', opacity: '0.05'
      }} viewBox="0 0 400 400" fill="none">
        <path d="M60 90 L200 90 L120 200 L280 200 L200 310 L60 310" 
              stroke="#FFFFFF" strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <div className="relative z-10 w-full max-w-[430px]">
        {/* Brand Row */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <svg width="34" height="34" viewBox="0 0 100 100">
            <path d="M28 20 L62 20 Q72 20 72 30 Q72 40 62 40 L38 40 L38 60 L72 60"
                  stroke="#D9DCE0" strokeWidth="15" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M28 40 Q18 40 18 50 Q18 60 28 60 L62 60 Q72 60 72 70 Q72 80 62 80 L28 80"
                  stroke="#8FB8D6" strokeWidth="15" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="font-outfit font-bold text-2xl text-white">
            Som<span style={{ color: '#8FB8D6' }}>Bill</span>
          </div>
        </div>

        {/* Glass Card */}
        <div className="rounded-2xl p-9" style={{
          background: 'rgba(255,255,255,.08)',
          border: '1px solid rgba(255,255,255,.16)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderRadius: '26px',
          boxShadow: '0 30px 60px -20px rgba(10,4,40,.55)'
        }}>
          {/* Eyebrow */}
          <p className="text-center mb-2" style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#B7D2E6'
          }}>
            Sombill POS
          </p>
          
          {/* Heading */}
          <h2 className="text-center mb-1.5 font-outfit font-bold text-white" style={{ fontSize: '26px' }}>
            Sign in to your station
          </h2>
          
          {/* Subtext */}
          <p className="text-center mb-7" style={{ fontSize: '13px', color: '#B6AFD6' }}>
            Trusted Hospitality Partner
          </p>

          {/* Role Pills */}
          <div className="flex gap-2 mb-6 p-1.5 rounded-xl" style={{
            background: 'rgba(255,255,255,.06)'
          }}>
            {[
              { id: 'cashier', label: 'Cashier' },
              { id: 'waiter', label: 'Waiter' },
              { id: 'kitchen', label: 'Kitchen' },
              { id: 'customer', label: 'Customer' },
              { id: 'admin', label: 'Admin' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className="flex-1 border-none bg-transparent font-outfit font-semibold cursor-pointer transition-all duration-180 py-2 px-1 rounded-lg"
                style={{
                  fontSize: '12.5px',
                  color: role === r.id ? '#12053B' : '#B6AFD6',
                  background: role === r.id ? '#8FB8D6' : 'transparent',
                  borderRadius: '10px'
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Restaurant ID */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{
                fontSize: '11.5px', fontWeight: '600', color: '#B6AFD6', letterSpacing: '0.02em'
              }}>
                Restaurant ID
              </label>
              <div className="flex items-center gap-2.5 rounded-xl py-3 px-3.5 transition-colors" style={{
                background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.14)'
              }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ stroke: '#B6AFD6' }} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <path d="M3 21V8l9-5 9 5v13"/>
                  <path d="M9 21v-6h6v6"/>
                </svg>
                <input
                  type="text"
                  placeholder="e.g. HRG-0142"
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="border-none bg-transparent outline-none w-full text-white"
                  style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{
                fontSize: '11.5px', fontWeight: '600', color: '#B6AFD6', letterSpacing: '0.02em'
              }}>
                Username
              </label>
              <div className="flex items-center gap-2.5 rounded-xl py-3 px-3.5 transition-colors" style={{
                background: 'rgba(255,255,255,.07)',
                border: '1px solid rgba(255,255,255,.14)'
              }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ stroke: '#B6AFD6' }} viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
                </svg>
                <input
                  type="text"
                  placeholder="cashier.hargeisa"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-none bg-transparent outline-none w-full text-white"
                  style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* 4-digit PIN */}
            <div className="mb-4">
              <label className="block mb-1.5" style={{
                fontSize: '11.5px', fontWeight: '600', color: '#B6AFD6', letterSpacing: '0.02em'
              }}>
                4-digit PIN
              </label>
              <div className="flex gap-2.5 mb-2">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    id={`pin-${index}`}
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(index, e)}
                    className="w-full text-center rounded-xl py-3 outline-none text-white transition-colors"
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontSize: '20px',
                      background: 'rgba(255,255,255,.07)',
                      border: '1px solid rgba(255,255,255,.14)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Row between */}
            <div className="flex justify-between items-center my-1 mb-6">
              <a href="#" className="text-xs font-semibold no-underline" style={{ color: '#B7D2E6' }}>
                Forgot PIN?
              </a>
              <div className="flex rounded-full overflow-hidden" style={{
                background: 'rgba(255,255,255,.07)', padding: '3px'
              }}>
                <button type="button" className="border-none bg-transparent cursor-pointer font-semibold py-1 px-2.5 rounded-full" style={{
                  fontSize: '11px', color: '#12053B', background: '#8FB8D6'
                }}>
                  EN
                </button>
                <button type="button" className="border-none bg-transparent cursor-pointer font-semibold py-1 px-2.5 rounded-full" style={{
                  fontSize: '11px', color: '#B6AFD6'
                }}>
                  SO
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm mb-4" style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#FCA5A5'
              }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3.5 border-none rounded-xl font-outfit font-semibold cursor-pointer flex items-center justify-center gap-2 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #8FB8D6 0%, #6E9BB9 100%)',
                color: '#12053B',
                fontSize: '15px',
                borderRadius: '14px',
                boxShadow: '0 12px 24px -8px rgba(143,184,214,.5)'
              }}
              loading={loading}
            >
              Start shift
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5.5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.14)' }}></div>
            <span className="text-xs" style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#B6AFD6' }}>
              OR
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,.14)' }}></div>
          </div>

          {/* NFC Tap - Placeholder */}
          <div className="flex items-center justify-center gap-2.5 rounded-xl py-3.5 cursor-not-allowed opacity-50" style={{
            border: '1.5px dashed rgba(255,255,255,.25)',
            color: '#B6AFD6',
            fontSize: '12.5px',
            fontWeight: '600'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ stroke: '#B7D2E6' }}>
              <rect x="2" y="7" width="20" height="13" rx="2"/>
              <circle cx="12" cy="13.5" r="2.5"/>
              <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
            </svg>
            Tap staff NFC badge to sign in
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6" style={{ fontSize: '11.5px', color: '#8880AC' }}>
          Not your station? Ask your manager for access.
        </p>
      </div>
    </div>
  )
}
