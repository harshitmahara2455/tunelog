import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif flex">

      {/* ── LEFT PANEL — branding ─────────────────────────── */}
    <div className="hidden lg:flex flex-col justify-between w-[50%] px-16 py-12 border-r border-white/[0.04] relative overflow-hidden">

        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '-20%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(29,207,170,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
          <span className="text-[14px] tracking-[0.18em] uppercase text-[#f0ede8] font-serif">
            Tunelog
          </span>
        </Link>

        {/* Center quote */}
        <div className="relative z-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1DCFAA] mb-8 font-bold font-serif">
            The Listeners Collective
          </p>
          <h2
            className="font-normal font-serif leading-[1.1] tracking-[-0.02em] mb-8"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}
          >
            Music worth<br />
            <em className="text-[#1DCFAA] italic">remembering.</em>
          </h2>
          <p className="text-[15px] text-[#5a6b6a] leading-[1.85] font-serif" style={{ maxWidth: '380px' }}>
            Join thousands of listeners building their music story —
            one album at a time. No algorithms, no noise.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="flex items-center gap-10 relative z-10">
          {[
            { val: '2,400+', label: 'Albums' },
            { val: '840+', label: 'Members' },
            { val: '12k+', label: 'Discussions' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-[1.3rem] font-light text-[#1DCFAA] mb-0.5 font-serif">{s.val}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#3a4a48] font-serif">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — form ────────────────────────────── */}
 <div className="flex-1 flex flex-col justify-center px-10 lg:px-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
          style={{ maxWidth: '420px' }}
        >
          {/* Mobile wordmark */}
          <Link href="/" className="flex items-center gap-2 mb-12 lg:hidden">
            <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
            <span className="text-[14px] tracking-[0.18em] uppercase font-serif">Tunelog</span>
          </Link>

          {/* Heading */}
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1DCFAA] mb-4 font-bold font-serif">
            Create account
          </p>
          <h1 className="text-[2rem] font-normal font-serif leading-[1.2] mb-2">
            Start your<br />
            <em className="text-[#1DCFAA] italic">music log.</em>
          </h1>
          <p className="text-[13px] text-[#3a4a48] font-serif mb-10">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1DCFAA] hover:underline transition-colors">
              Log in
            </Link>
          </p>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950 border border-red-900/50 text-red-300 px-4 py-3 rounded-xl mb-6 text-[12px] font-serif"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-5">

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#3a5452] mb-2.5 font-serif">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="yourname"
                className="w-full bg-white/[0.03] border border-white/[0.07] text-[#f0ede8] px-5 py-3.5 rounded-xl text-[14px] font-serif placeholder-[#2a3838] outline-none transition-colors"
                style={{ caretColor: '#1DCFAA' }}
                onFocus={e => e.target.style.borderColor = 'rgba(29,207,170,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#3a5452] mb-2.5 font-serif">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white/[0.03] border border-white/[0.07] text-[#f0ede8] px-5 py-3.5 rounded-xl text-[14px] font-serif placeholder-[#2a3838] outline-none transition-colors"
                style={{ caretColor: '#1DCFAA' }}
                onFocus={e => e.target.style.borderColor = 'rgba(29,207,170,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#3a5452] mb-2.5 font-serif">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="min 6 characters"
                className="w-full bg-white/[0.03] border border-white/[0.07] text-[#f0ede8] px-5 py-3.5 rounded-xl text-[14px] font-serif placeholder-[#2a3838] outline-none transition-colors"
                style={{ caretColor: '#1DCFAA' }}
                onFocus={e => e.target.style.borderColor = 'rgba(29,207,170,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
              <p className="text-[11px] text-[#2a3838] mt-2 font-serif">
                At least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1DCFAA] text-[#050505] py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none font-serif mt-2"
            >
              {loading ? 'Creating your account...' : 'Create account'}
            </button>

          </form>

          <p className="text-[11px] text-[#2a3838] mt-8 leading-[1.7] font-serif text-center">
            By signing up you agree to our community guidelines.
            No spam, no ads, just music.
          </p>

        </motion.div>
      </div>

    </div>
  )
}