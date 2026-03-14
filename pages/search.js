import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const SUGGESTED = [
  'Kendrick Lamar', 'Frank Ocean', 'Radiohead',
  'Amy Winehouse', 'The Beatles', 'Miles Davis',
]

export default function Search() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  // pre-fill search from navbar query param
  useEffect(() => {
    if (router.query.q) {
      setQuery(router.query.q)
      handleSearchQuery(router.query.q)
    }
  }, [router.query.q])

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUser(session.user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
    }
    getUser()
  }, [])

  async function handleSearchQuery(q) {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)

    const res = await fetch(
      `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(q)}&type=album&limit=12&fmt=json`,
      { headers: { 'User-Agent': 'Tunelog/1.0 (your@email.com)' } }
    )
    const data = await res.json()
    setResults(data['release-groups'] || [])
    setLoading(false)
  }

  async function handleSearch(e) {
    e.preventDefault()
    handleSearchQuery(query)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">

      <Navbar user={user} profile={profile} onLogout={handleLogout} />

      <main className="px-16 lg:px-28 py-16">

        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1DCFAA] mb-4 font-bold font-serif">
            The Archive
          </p>
          <h1
            className="font-normal font-serif leading-[1.1] tracking-[-0.02em] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}
          >
            Find your next<br />
            <em className="text-[#1DCFAA] italic">obsession.</em>
          </h1>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-4 mt-10"
          >
            <div
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-full px-6 py-4 flex-1 transition-colors"
              style={{ maxWidth: '600px' }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(29,207,170,0.3)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a5452" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search albums, artists..."
                className="flex-1 bg-transparent border-none outline-none text-[#f0ede8] text-[15px] font-serif placeholder-[#2a3838]"
                style={{ caretColor: '#1DCFAA' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setResults([]); setSearched(false) }}
                  className="text-[#3a4a48] hover:text-[#f0ede8] transition-colors bg-transparent border-none cursor-pointer text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#1DCFAA] text-[#050505] px-8 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 border-none cursor-pointer font-serif flex-shrink-0"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Suggested searches — shown before first search */}
          {!searched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3 mt-6 flex-wrap"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] font-serif">
                Try:
              </span>
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(s); handleSearchQuery(s) }}
                  className="text-[11px] text-[#3a5452] border border-white/[0.05] px-4 py-1.5 rounded-full hover:border-[#1DCFAA33] hover:text-[#1DCFAA] transition-all bg-transparent cursor-pointer font-serif"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ── RESULTS ──────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Loading state */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
              <p className="text-[12px] uppercase tracking-[0.3em] text-[#2a3838] font-serif">
                Searching the archive...
              </p>
            </motion.div>
          )}

          {/* No results */}
          {searched && !loading && results.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <p className="text-[2rem] font-normal font-serif text-[#1a2828]">◎</p>
              <p className="text-[13px] text-[#3a4a48] font-serif">
                No albums found for <em className="text-[#5a6b6a]">"{query}"</em>
              </p>
              <p className="text-[11px] text-[#2a3838] font-serif">
                Try a different spelling or artist name
              </p>
            </motion.div>
          )}

          {/* Results grid */}
          {!loading && results.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#3a5452] font-serif">
                  {results.length} results for{' '}
                  <em className="text-[#5a6b6a] not-italic">"{query}"</em>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {results.map((album, i) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/album/${album.id}`}
                      className="block group"
                    >
                      {/* Cover */}
                      <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.06] mb-3 bg-[#0d1614] group-hover:border-[#1DCFAA33] transition-colors">
                        <AlbumCover
                          mbid={album.id}
                          title={album.title}
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-[#1DCFAA]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
                        {/* Play hint */}
                        <div className="absolute bottom-2 right-2 w-7 h-7 bg-[#1DCFAA] rounded-full flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="#050505">
                            <path d="M5 3l14 9-14 9V3z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Info */}
                      <p className="text-[12px] text-[#c0cdc8] truncate font-serif mb-1 group-hover:text-[#f0ede8] transition-colors">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-[#3a4a48] truncate font-serif">
                        {album['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'}
                      </p>
                      {album['first-release-date'] && (
                        <p className="text-[10px] text-[#2a3838] font-serif mt-0.5">
                          {album['first-release-date'].substring(0, 4)}
                        </p>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}

function AlbumCover({ mbid, title }) {
  const [src, setSrc] = useState(
    `https://coverartarchive.org/release-group/${mbid}/front-250`
  )
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl text-[#1DCFAA] opacity-20 font-serif">♪</span>
        </div>
      )}
      <img
        src={src}
        alt={title}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        onLoad={() => setLoaded(true)}
        onError={() => { setSrc(null); setLoaded(true) }}
      />
    </div>
  )
}