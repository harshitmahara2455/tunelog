import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'

export default function AlbumPage() {
  const router = useRouter()
  const { id } = router.query
  const [album, setAlbum] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [coverError, setCoverError] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('tracklist')

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

  useEffect(() => {
    if (!id) return
    fetchAlbum()
  }, [id])

  async function fetchAlbum() {
    setLoading(true)

    const albumRes = await fetch(
      `https://musicbrainz.org/ws/2/release-group/${id}?inc=artists+releases&fmt=json`,
      { headers: { 'User-Agent': 'Tunelog/1.0 (your@email.com)' } }
    )
    const albumData = await albumRes.json()
    setAlbum(albumData)

    if (albumData.releases?.[0]?.id) {
      const releaseId = albumData.releases[0].id
      const trackRes = await fetch(
        `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`,
        { headers: { 'User-Agent': 'Tunelog/1.0 (your@email.com)' } }
      )
      const trackData = await trackRes.json()
      setTracks(trackData.media?.[0]?.tracks || [])
    }

    setLoading(false)
  }

  function formatDuration(ms) {
    if (!ms) return '--:--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#2a3838] font-serif">
            Loading album...
          </p>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[2rem] text-[#1a2828] font-serif mb-4">◎</p>
          <p className="text-[13px] text-[#3a4a48] font-serif">Album not found.</p>
          <Link href="/search" className="text-[11px] text-[#1DCFAA] mt-4 block tracking-wider">
            Back to search →
          </Link>
        </div>
      </div>
    )
  }

  const artistName = album['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
  const releaseYear = album['first-release-date']?.substring(0, 4) || ''
  const coverUrl = `https://coverartarchive.org/release-group/${id}/front-500`
  const totalDuration = tracks.reduce((acc, t) => acc + (t.length || 0), 0)

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">

      <Navbar user={user} profile={profile} onLogout={handleLogout} />

      {/* ── ALBUM HERO ───────────────────────────────────────── */}
      <section className="px-16 lg:px-28 pt-16 pb-12 border-b border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end gap-10"
        >
          {/* Cover art */}
          <div
            className="flex-shrink-0 rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{ width: '220px', height: '220px', background: '#0d1614' }}
          >
            {!coverError ? (
              <img
                src={coverUrl}
                alt={album.title}
                className="w-full h-full object-cover"
                onError={() => setCoverError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl text-[#1DCFAA] opacity-20 font-serif">♪</span>
              </div>
            )}
          </div>

          {/* Album info */}
          <div className="flex-1 min-w-0 pb-2">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#1DCFAA] mb-4 font-bold font-serif">
              Album
            </p>
            <h1
              className="font-normal font-serif leading-[1.05] tracking-[-0.02em] mb-4 truncate"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            >
              {album.title}
            </h1>
            <p className="text-[18px] text-[#8a9b9a] font-serif mb-2">{artistName}</p>
            <div className="flex items-center gap-4 mt-3">
              {releaseYear && (
                <span className="text-[12px] text-[#3a4a48] font-serif">{releaseYear}</span>
              )}
              {tracks.length > 0 && (
                <>
                  <span className="text-[#1a2828]">·</span>
                  <span className="text-[12px] text-[#3a4a48] font-serif">
                    {tracks.length} tracks
                  </span>
                  <span className="text-[#1a2828]">·</span>
                  <span className="text-[12px] text-[#3a4a48] font-serif">
                    {formatDuration(totalDuration)}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-8">
              {user ? (
                <button className="bg-[#1DCFAA] text-[#050505] px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer font-serif">
                  Log this album
                </button>
              ) : (
                <Link href="/signup">
                  <button className="bg-[#1DCFAA] text-[#050505] px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer font-serif">
                    Sign up to log
                  </button>
                </Link>
              )}
              <button className="border border-white/[0.07] text-[#6b7b7a] px-7 py-3 rounded-full text-[11px] uppercase tracking-[0.2em] hover:border-[#1DCFAA33] hover:text-[#1DCFAA] transition-all bg-transparent cursor-pointer font-serif">
                Share
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── TABS + CONTENT ───────────────────────────────────── */}
      <section className="px-16 lg:px-28 py-10">
        <div
          className="grid gap-10"
          style={{ gridTemplateColumns: '1fr 340px' }}
        >

          {/* Left — tabs */}
          <div>
            {/* Tab switcher */}
            <div className="flex items-center gap-1 mb-8 border-b border-white/[0.04]">
              {['tracklist', 'discussion'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-1 pb-4 mr-6 text-[11px] uppercase tracking-[0.2em] font-serif border-b-2 transition-all bg-transparent cursor-pointer border-x-0 border-t-0 ${
                    activeTab === tab
                      ? 'text-[#f0ede8] border-[#1DCFAA]'
                      : 'text-[#3a4a48] border-transparent hover:text-[#6b7b7a]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tracklist */}
            {activeTab === 'tracklist' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {tracks.length > 0 ? (
                  <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl overflow-hidden">
                    {tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-5 px-6 py-3.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors group"
                      >
                        <span className="text-[12px] text-[#2a3838] w-5 text-right flex-shrink-0 font-serif group-hover:text-[#1DCFAA] transition-colors">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-[13px] text-[#c0cdc8] font-serif group-hover:text-[#f0ede8] transition-colors truncate">
                          {track.title}
                        </span>
                        <span className="text-[11px] text-[#2a3838] font-serif flex-shrink-0">
                          {formatDuration(track.length)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <p className="text-[1.5rem] text-[#1a2828] font-serif">◎</p>
                    <p className="text-[12px] text-[#3a4a48] font-serif">
                      No tracklist available
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Discussion tab */}
            {activeTab === 'discussion' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {user ? (
                  <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl p-6 mb-6">
                    <textarea
                      rows={3}
                      placeholder="What do you think about this album..."
                      className="w-full bg-transparent border-none outline-none text-[#f0ede8] text-[14px] font-serif placeholder-[#2a3838] resize-none"
                      style={{ caretColor: '#1DCFAA' }}
                    />
                    <div className="flex justify-end mt-4 pt-4 border-t border-white/[0.04]">
                      <button className="bg-[#1DCFAA] text-[#050505] px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all border-none cursor-pointer font-serif">
                        Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl p-8 text-center mb-6">
                    <p className="text-[13px] text-[#3a4a48] font-serif mb-4">
                      Join the conversation
                    </p>
                    <Link href="/signup">
                      <button className="bg-[#1DCFAA] text-[#050505] px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all border-none cursor-pointer font-serif">
                        Sign up to comment
                      </button>
                    </Link>
                  </div>
                )}

                {/* Comments placeholder */}
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-[1.5rem] text-[#1a2828] font-serif">◎</p>
                  <p className="text-[12px] text-[#3a4a48] font-serif">
                    No comments yet — be the first
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right — album meta sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* About card */}
            <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#3a5452] mb-5 font-serif font-bold">
                About
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] mb-1.5 font-serif">Artist</p>
                  <p className="text-[13px] text-[#c0cdc8] font-serif">{artistName}</p>
                </div>
                {releaseYear && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] mb-1.5 font-serif">Released</p>
                    <p className="text-[13px] text-[#c0cdc8] font-serif">{releaseYear}</p>
                  </div>
                )}
                {tracks.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] mb-1.5 font-serif">Tracks</p>
                    <p className="text-[13px] text-[#c0cdc8] font-serif">{tracks.length}</p>
                  </div>
                )}
                {totalDuration > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] mb-1.5 font-serif">Runtime</p>
                    <p className="text-[13px] text-[#c0cdc8] font-serif">{formatDuration(totalDuration)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Community card */}
            <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#3a5452] mb-5 font-serif font-bold">
                Community
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] mb-1.5 font-serif">Discussions</p>
                  <p className="text-[13px] text-[#c0cdc8] font-serif">0 comments</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] mb-1.5 font-serif">Logged by</p>
                  <p className="text-[13px] text-[#c0cdc8] font-serif">0 members</p>
                </div>
              </div>
            </div>

            {/* Related search */}
            <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#3a5452] mb-5 font-serif font-bold">
                Explore more
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(artistName)}`}
                className="text-[12px] text-[#3a5452] hover:text-[#1DCFAA] transition-colors font-serif"
              >
                More by {artistName} →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}