import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Recommendations() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loggedAlbumIds, setLoggedAlbumIds] = useState(new Set())

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)
      await fetchRecommendations(session.user.id)
    }
    init()
  }, [])

  async function fetchRecommendations(userId) {
    setLoading(true)

    // Step 1 — get user's logged albums with artist MBIDs
    const { data: listens } = await supabase
      .from('listens')
      .select('album_id, artist_mbid, artist_name, rating')
      .eq('user_id', userId)
      .not('artist_mbid', 'is', null)

    if (!listens || listens.length === 0) {
      setLoading(false)
      return
    }

    // track logged album IDs to filter them out later
    const loggedIds = new Set(listens.map(l => l.album_id))
    setLoggedAlbumIds(loggedIds)

    // Step 2 — get unique artist MBIDs, prioritise higher rated
    const sorted = [...listens].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    const uniqueArtists = []
    const seen = new Set()
    for (const listen of sorted) {
      if (!seen.has(listen.artist_mbid)) {
        seen.add(listen.artist_mbid)
        uniqueArtists.push(listen)
        if (uniqueArtists.length >= 5) break
      }
    }

    // Step 3 — call ListenBrainz similar-artists for each
    const similarArtistIds = new Set()
    await Promise.all(
      uniqueArtists.map(async (listen) => {
        try {
          const res = await fetch(
            `https://api.listenbrainz.org/1/lb-radio/artist/${listen.artist_mbid}?mode=easy&max_similar_artists=3`,
          )
          if (!res.ok) return
          const data = await res.json()
          const artists = data?.payload?.jspf?.track || []
          artists.forEach(a => {
            const mbid = a?.identifier?.split('/')?.[4]
            if (mbid) similarArtistIds.add(mbid)
          })
        } catch (e) {
          // silently skip failed requests
        }
      })
    )

    if (similarArtistIds.size === 0) {
      // fallback — use Last.fm similar artists
      await fallbackRecommendations(uniqueArtists, loggedIds)
      return
    }

    // Step 4 — fetch top album for each similar artist from MusicBrainz
    const recs = []
    await Promise.all(
      [...similarArtistIds].slice(0, 12).map(async (artistMbid) => {
        try {
          const res = await fetch(
            `https://musicbrainz.org/ws/2/release-group?artist=${artistMbid}&type=album&limit=1&fmt=json`,
            { headers: { 'User-Agent': 'Tunelog/1.0 (your@email.com)' } }
          )
          const data = await res.json()
          const album = data['release-groups']?.[0]
          if (!album || loggedIds.has(album.id)) return
          recs.push({
            mbid: album.id,
            title: album.title,
            artist: album['artist-credit']?.[0]?.artist?.name || 'Unknown',
            year: album['first-release-date']?.substring(0, 4) || '',
          })
        } catch (e) {
          // silently skip
        }
      })
    )

    setRecommendations(recs.filter(r => !loggedIds.has(r.mbid)))
    setLoading(false)
  }

  async function fallbackRecommendations(artists, loggedIds) {
    // fallback using MusicBrainz similar artists tag search
    const recs = []
    await Promise.all(
      artists.slice(0, 3).map(async (listen) => {
        try {
          const res = await fetch(
            `https://musicbrainz.org/ws/2/release-group?query=artist:${encodeURIComponent(listen.artist_name)}&type=album&limit=3&fmt=json`,
            { headers: { 'User-Agent': 'Tunelog/1.0 (your@email.com)' } }
          )
          const data = await res.json()
          const albums = data['release-groups'] || []
          albums.forEach(album => {
            if (!loggedIds.has(album.id)) {
              recs.push({
                mbid: album.id,
                title: album.title,
                artist: album['artist-credit']?.[0]?.artist?.name || 'Unknown',
                year: album['first-release-date']?.substring(0, 4) || '',
              })
            }
          })
        } catch (e) {}
      })
    )
    setRecommendations(recs.slice(0, 12))
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">
      <Navbar user={user} profile={profile} onLogout={handleLogout} />

      <main className="px-16 lg:px-28 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1DCFAA] mb-4 font-bold font-serif">
            For you
          </p>
          <h1
            className="font-normal font-serif leading-[1.1] tracking-[-0.02em] mb-6"
            style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}
          >
            Your next<br />
            <em className="text-[#1DCFAA] italic">obsession.</em>
          </h1>
          <p className="text-[14px] text-[#5a6b6a] font-serif leading-relaxed" style={{ maxWidth: '480px' }}>
            Based on what you've logged — no algorithms, no label money.
            Just music similar to what you already love.
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#2a3838] font-serif">
              Finding your next obsession...
            </p>
          </div>
        )}

        {/* No listens yet */}
        {!loading && loggedAlbumIds.size === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-5"
          >
            <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
            <p className="text-[14px] text-[#3a4a48] font-serif text-center">
              Log some albums first so we can recommend music you'll love
            </p>
            <Link href="/search">
              <button className="bg-[#1DCFAA] text-[#050505] px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all border-none cursor-pointer font-serif mt-2">
                Find albums to log
              </button>
            </Link>
          </motion.div>
        )}

        {/* No recommendations found */}
        {!loading && loggedAlbumIds.size > 0 && recommendations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-4"
          >
            <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
            <p className="text-[13px] text-[#3a4a48] font-serif">
              Couldn't find recommendations right now — try logging more albums
            </p>
          </motion.div>
        )}

        {/* Recommendations grid */}
        {!loading && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#3a5452] font-serif">
                {recommendations.length} recommendations based on your taste
              </p>
              <button
                onClick={() => fetchRecommendations(user.id)}
                className="text-[11px] text-[#3a5452] hover:text-[#1DCFAA] transition-colors font-serif tracking-wider bg-transparent border-none cursor-pointer"
              >
                Refresh →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {recommendations.map((album, i) => (
                <motion.div
                  key={album.mbid}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/album/${album.mbid}`} className="block group">
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.06] mb-3 bg-[#0d1614] group-hover:border-[#1DCFAA33] transition-colors">
                      <AlbumCover mbid={album.mbid} title={album.title} />
                      <div className="absolute inset-0 bg-[#1DCFAA]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 right-2 w-7 h-7 bg-[#1DCFAA] rounded-full flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#050505">
                          <path d="M5 3l14 9-14 9V3z"/>
                        </svg>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#c0cdc8] truncate font-serif mb-1 group-hover:text-[#f0ede8] transition-colors">
                      {album.title}
                    </p>
                    <p className="text-[11px] text-[#3a4a48] truncate font-serif">
                      {album.artist}
                    </p>
                    {album.year && (
                      <p className="text-[10px] text-[#2a3838] font-serif mt-0.5">
                        {album.year}
                      </p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

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