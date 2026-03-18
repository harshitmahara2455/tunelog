import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Navbar({ user, profile, onLogout }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-b border-white/[0.05] sticky top-0 bg-[#050505] z-50"
    >
      <nav className="px-16 lg:px-24 py-5 flex items-center justify-between gap-8">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
          <span className="text-[14px] tracking-[0.18em] text-[#f0ede8] uppercase font-serif">
            Tunelog
          </span>
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-full px-5 py-2.5 w-[280px] hover:border-white/10 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3a5452" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="bg-transparent border-none outline-none text-[#c0cdc8] text-[12px] flex-1 font-serif"
            placeholder="Search albums, artists..."
            style={{ color: '#c0cdc8' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Right */}
        <div className="flex items-center gap-7 flex-shrink-0">
          <Link
            href="/search"
            className="text-[11px] text-[#4a5a58] tracking-[0.12em] uppercase hover:text-[#1DCFAA] transition-colors font-serif"
          >
            Discover
          </Link>

          {user ? (
            <>
            <Link
  href={`/profile/${profile?.username}`}
  className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] px-4 py-2 rounded-full hover:border-[#1DCFAA22] transition-colors"
>
  <div className="w-5 h-5 rounded-full bg-[#1a3a38] flex items-center justify-center text-[#1DCFAA] text-[10px] font-bold">
    {profile?.username?.[0]?.toUpperCase()}
  </div>
  <span className="text-[11px] text-[#8a9b9a] font-serif">
    {profile?.username}
  </span>
</Link>
              <button
                onClick={onLogout}
                className="text-[11px] text-[#3a5452] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer font-serif tracking-[0.12em] uppercase"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[11px] text-[#4a5a58] tracking-[0.12em] uppercase hover:text-[#1DCFAA] transition-colors font-serif"
              >
                Log in
              </Link>
              <Link href="/signup">
                <button className="bg-[#1DCFAA] text-[#050505] text-[10px] font-bold tracking-[0.18em] uppercase px-5 py-2.5 rounded-full hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none font-serif">
                  Sign up
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </motion.div>
  )
}