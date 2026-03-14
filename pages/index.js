import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import AlbumCard from '../components/AlbumCard'

const TRENDING_QUERIES = [
  'To Pimp a Butterfly Kendrick Lamar',
  'OK Computer Radiohead',
  'Channel Orange Frank Ocean',
  'Blue Joni Mitchell',
  'Blonde Frank Ocean',
  'Rumours Fleetwood Mac',
]

const ACTIVITY = [
  { initial: 'M', color: '#1DCFAA', bg: '#1a3a38', user: 'maya', album: 'OK Computer', comment: '"Exit Music still hits different..."', time: '2m' },
  { initial: 'R', color: '#5aafcf', bg: '#1a2a3a', user: 'rohan', album: 'Channel Orange', comment: '"Pink Matter is underrated"', time: '5m' },
  { initial: 'S', color: '#af8acf', bg: '#2a1a3a', user: 'sara', album: 'Blue', comment: '"First listen and I\'m crying"', time: '8m' },
  { initial: 'A', color: '#cfaa1D', bg: '#2a2a1a', user: 'arjun', album: 'Rumours', comment: '"Go Your Own Way is perfect"', time: '12m' },
]

const FEATURES = [
  { icon: '◎', title: 'Deep discussions', desc: 'Every album has its own thread. Go track by track, talk production, lyrics, feelings — no shallow takes.' },
  { icon: '⊹', title: 'Honest recommendations', desc: 'Suggestions built from what your community actually loves — not what labels paid to promote.' },
  { icon: '◈', title: 'Weekly drops on WhatsApp', desc: 'Get a new album recommendation every Monday morning, personalised to your taste.' },
]

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trending, setTrending] = useState([])

useEffect(() => {
  async function fetchTrending() {
    const results = await Promise.all(
      TRENDING_QUERIES.map(async (q) => {
        const res = await fetch(
          `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(q)}&type=album&limit=1&fmt=json`,
          { headers: { 'User-Agent': 'Tunelog/1.0 (your@email.com)' } }
        )
        const data = await res.json()
        const album = data['release-groups']?.[0]
        if (!album) return null
        return {
          title: album.title,
          artist: album['artist-credit']?.[0]?.artist?.name || '',
          year: album['first-release-date']?.substring(0, 4) || '',
          mbid: album.id,
        }
      })
    )
    setTrending(results.filter(Boolean))
  }
  fetchTrending()
}, [])

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      setUser(session.user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-[#1DCFAA] live-dot" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">
      <Navbar user={user} profile={profile} onLogout={handleLogout} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-12 lg:px-24 overflow-hidden">

        {/* Ambient glow */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '-8%',
            width: '700px',
            height: '700px',
            background: 'radial-gradient(circle, rgba(29,207,170,0.07) 0%, transparent 70%)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-4 mb-10">
              <span className="w-10 h-px bg-[#1DCFAA]" style={{ opacity: 0.5 }} />
              <span className="text-[10px] tracking-[0.45em] text-[#1DCFAA] uppercase font-bold font-serif">
                The Listeners Collective
              </span>
            </div>

            {/* Headline — two lines, dramatic */}
            <h1
              className="font-normal font-serif leading-[0.88] tracking-[-0.03em] mb-16"
              style={{ fontSize: 'clamp(5rem, 9vw, 10rem)' }}
            >
              Records<br />
              <em
                className="text-[#1DCFAA] italic"
                style={{ paddingLeft: 'clamp(2rem, 5vw, 6rem)', display: 'block' }}
              >
                that resonate.
              </em>
            </h1>

            {/* Bottom row — description + buttons + activity */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">

              {/* Left — text + buttons */}
              <div>
                <p
                  className="text-[#5a6b6a] leading-[1.85] mb-10 font-serif font-light"
                  style={{ fontSize: '17px', maxWidth: '480px' }}
                >
                  A space for high-fidelity discovery. No algorithms,
                  no noise — just the music that moves you and the
                  people who hear it too.
                </p>
                <div className="flex items-center gap-4">
                  {user ? (
                    <Link href="/search">
                      <button className="bg-[#1DCFAA] text-[#050505] px-9 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer font-serif">
                        Browse Albums
                      </button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup">
                        <button className="bg-[#1DCFAA] text-[#050505] px-9 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer font-serif">
                          Join Tunelog
                        </button>
                      </Link>
                      <Link href="/search">
                        <button className="border border-white/10 text-[#8a9b9a] px-9 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 hover:text-white transition-all bg-transparent cursor-pointer font-serif">
                          The Archive
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Right — live activity card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="bg-[#0d1614] border border-[#1a2828] rounded-2xl overflow-hidden flex-shrink-0"
                style={{ width: '320px' }}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#141e1e]">
                  <p className="text-[10px] tracking-[0.2em] text-[#3a5452] uppercase m-0 font-serif">
                    Live activity
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="live-dot w-1.5 h-1.5 rounded-full bg-[#1DCFAA]" />
                    <span className="text-[10px] text-[#1DCFAA] font-serif">live</span>
                  </div>
                </div>

                {ACTIVITY.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-[#0f1a18] last:border-0 hover:bg-[#0f1e1b] transition-colors cursor-pointer"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: item.bg, color: item.color }}
                    >
                      {item.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#c0cdc8] m-0 mb-0.5 font-serif">
                        {item.user}
                        <span className="text-[#2a3838]"> · </span>
                        <span className="text-[#4a5a58]">{item.album}</span>
                      </p>
                      <p className="text-[11px] text-[#3a4848] m-0 font-serif truncate">
                        {item.comment}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#2a3838] flex-shrink-0 font-serif ml-1">
                      {item.time}
                    </span>
                  </div>
                ))}

                <div className="px-5 py-3 bg-[#0a1210] border-t border-[#141e1e]">
                  <Link href="/search">
                    <p className="text-[10px] text-[#2a4a42] hover:text-[#1DCFAA] transition-colors text-center tracking-[0.18em] uppercase font-serif cursor-pointer m-0">
                      Join the conversation →
                    </p>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <div className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="px-16 lg:px-24 py-14 grid grid-cols-3 gap-12">
          {[
            { val: '2,400+', label: 'Albums Reviewed' },
            { val: '840+', label: 'Active Members' },
            { val: '12,000+', label: 'Global Discussions' },
          ].map((s, i) => (
            <div key={i} className="flex flex-col">
              <p className="text-[2.2rem] font-light tracking-tight text-[#1DCFAA] mb-1.5 font-serif">{s.val}</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#3a4a48] font-serif">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRENDING ─────────────────────────────────────────── */}
      <section className="px-16 lg:px-24 py-24">
        <div className="flex justify-between items-end mb-14">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#1DCFAA] mb-4 font-bold font-serif">
              Curated Selection
            </h2>
            <p className="text-[2.2rem] font-normal tracking-tight font-serif m-0">
              Essential Listens
            </p>
          </div>
          <Link
            href="/search"
            className="text-[11px] uppercase tracking-widest text-[#4a5a58] hover:text-[#1DCFAA] transition-colors font-serif pb-0.5 border-b border-transparent hover:border-[#1DCFAA]"
          >
            Explore All →
          </Link>
        </div>

<div className="grid grid-cols-6 gap-8">
  {trending.map((album, i) => (
    <AlbumCard
      key={i}
      title={album.title}
      artist={album.artist}
      year={album.year}
      mbid={album.mbid}
      index={i}
    />
  ))}
</div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="px-16 lg:px-24 py-10 border-t border-white/[0.04]">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#3a5452] mb-10 font-serif font-bold">
          Why Tunelog
        </p>
        <div className="grid grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="bg-[#0d1614] border border-[#1a2828] rounded-2xl p-8 hover:border-[#1DCFAA22] transition-colors group"
            >
              <p className="text-[20px] text-[#1DCFAA] mb-5 font-serif">{f.icon}</p>
              <p className="text-[13px] text-[#c0cdc8] mb-3 font-serif tracking-wide">{f.title}</p>
              <p className="text-[12px] text-[#3a4a48] leading-[1.85] font-serif m-0 group-hover:text-[#4a5a58] transition-colors">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────── */}
      {!user && (
        <section className="px-16 lg:px-24 py-24">
          <div
            className="border border-white/5 rounded-[2.5rem] p-20 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d1614, #050505)' }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(29,207,170,0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <h3
              className="font-normal tracking-tight font-serif mb-10 relative z-10"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}
            >
              Start your <em className="italic text-[#1DCFAA]">log.</em>
            </h3>
            <p className="text-[#4a5a58] text-[15px] leading-relaxed mb-10 font-serif relative z-10 max-w-md mx-auto">
              Join thousands of listeners building their music story — one album at a time.
            </p>
            <Link href="/signup">
              <button className="bg-[#1DCFAA] text-[#050505] px-12 py-4 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer font-serif relative z-10">
                Create a Profile
              </button>
            </Link>
          </div>
        </section>
      )}

    </div>
  )
}