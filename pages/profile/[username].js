import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { username } = router.query
  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [profileUser, setProfileUser] = useState(null)
  const [listens, setListens] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('library')

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setCurrentUser(session.user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setCurrentProfile(data)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!username) return
    fetchProfile()
  }, [username])

  async function fetchProfile() {
    setLoading(true)

    // fetch profile by username
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single()

    if (!profile) {
      setLoading(false)
      return
    }

    setProfileUser(profile)

    // fetch their listens
    const { data: listenData } = await supabase
      .from('listens')
      .select('*')
      .eq('user_id', profile.id)
      .order('listened_at', { ascending: false })

    setListens(listenData || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setCurrentProfile(null)
    router.push('/')
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOwnProfile = currentProfile?.username === username
  const avgRating = listens.filter(l => l.rating).length > 0
    ? (listens.filter(l => l.rating).reduce((acc, l) => acc + l.rating, 0) / listens.filter(l => l.rating).length).toFixed(1)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#2a3838] font-serif">
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[2rem] text-[#1a2828] font-serif mb-4">◎</p>
          <p className="text-[13px] text-[#3a4a48] font-serif">User not found.</p>
          <Link href="/" className="text-[11px] text-[#1DCFAA] mt-4 block tracking-wider">
            Go home →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">

      <Navbar user={currentUser} profile={currentProfile} onLogout={handleLogout} />

      {/* ── PROFILE HEADER ───────────────────────────────────── */}
      <section className="px-16 lg:px-28 pt-16 pb-12 border-b border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between"
        >
          <div className="flex items-end gap-8">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
              style={{ background: '#1a3a38', color: '#1DCFAA' }}
            >
              {profileUser.username?.[0]?.toUpperCase()}
            </div>

            {/* Info */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#1DCFAA] mb-3 font-bold font-serif">
                Listener
              </p>
              <h1
                className="font-normal font-serif leading-[1.1] mb-2"
                style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}
              >
                {profileUser.username}
              </h1>
              {profileUser.bio && (
                <p className="text-[14px] text-[#5a6b6a] font-serif max-w-md">
                  {profileUser.bio}
                </p>
              )}
            </div>
          </div>

          {/* Edit profile button if own profile */}
          {isOwnProfile && (
            <button className="border border-white/[0.07] text-[#6b7b7a] px-6 py-2.5 rounded-full text-[11px] uppercase tracking-[0.2em] hover:border-[#1DCFAA33] hover:text-[#1DCFAA] transition-all bg-transparent cursor-pointer font-serif">
              Edit profile
            </button>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-12 mt-10 pt-8 border-t border-white/[0.04]"
        >
          {[
            { val: listens.length, label: 'Albums logged' },
            { val: listens.filter(l => l.first_listen).length, label: 'First listens' },
            { val: avgRating ? `${avgRating} / 5` : '—', label: 'Avg rating' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-[1.6rem] font-light text-[#c0cdc8] mb-1 font-serif">{s.val}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#3a4a48] font-serif">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── TABS + CONTENT ───────────────────────────────────── */}
      <section className="px-16 lg:px-28 py-10">

        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-10 border-b border-white/[0.04]">
          {['library', 'recent'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 pb-4 mr-6 text-[11px] uppercase tracking-[0.2em] font-serif border-b-2 transition-all bg-transparent cursor-pointer border-x-0 border-t-0 ${
                activeTab === tab
                  ? 'text-[#f0ede8] border-[#1DCFAA]'
                  : 'text-[#3a4a48] border-transparent hover:text-[#6b7b7a]'
              }`}
            >
              {tab === 'library' ? `Library (${listens.length})` : 'Recent'}
            </button>
          ))}
        </div>

        {/* Library — album grid */}
        {activeTab === 'library' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {listens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
                <p className="text-[13px] text-[#3a4a48] font-serif">
                  {isOwnProfile ? 'You haven\'t logged any albums yet' : 'No albums logged yet'}
                </p>
                {isOwnProfile && (
                  <Link href="/search">
                    <button className="bg-[#1DCFAA] text-[#050505] px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all border-none cursor-pointer font-serif mt-2">
                      Find albums to log
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-5">
                {listens.map((listen, i) => (
                  <motion.div
                    key={listen.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/album/${listen.album_id}`} className="block group">
                      <div className="relative aspect-square rounded-xl overflow-hidden border border-white/[0.06] mb-2 bg-[#0d1614] group-hover:border-[#1DCFAA33] transition-colors">
                        {listen.cover_url ? (
                          <img
                            src={listen.cover_url}
                            alt={listen.album_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xl text-[#1DCFAA] opacity-20 font-serif">♪</span>
                          </div>
                        )}
                        {/* Rating badge */}
                        {listen.rating && (
                          <div className="absolute bottom-1.5 right-1.5 bg-black/70 px-1.5 py-0.5 rounded-md">
                            <span className="text-[10px] text-[#1DCFAA] font-serif">
                              {'★'.repeat(listen.rating)}
                            </span>
                          </div>
                        )}
                        {/* First listen badge */}
                        {listen.first_listen && (
                          <div className="absolute top-1.5 left-1.5 bg-[#1DCFAA]/20 border border-[#1DCFAA]/30 px-1.5 py-0.5 rounded-md">
                            <span className="text-[9px] text-[#1DCFAA] font-serif uppercase tracking-wider">
                              First
                            </span>
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-[#1DCFAA]/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[11px] text-[#c0cdc8] truncate font-serif group-hover:text-[#f0ede8] transition-colors">
                        {listen.album_title}
                      </p>
                      <p className="text-[10px] text-[#3a4a48] truncate font-serif">
                        {listen.artist_name}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Recent — list view */}
        {activeTab === 'recent' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {listens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
                <p className="text-[13px] text-[#3a4a48] font-serif">No activity yet</p>
              </div>
            ) : (
              <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl overflow-hidden">
                {listens.slice(0, 20).map((listen, i) => (
                  <Link
                    key={listen.id}
                    href={`/album/${listen.album_id}`}
                    className="flex items-center gap-5 px-6 py-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Cover */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/[0.06] bg-[#111a18]">
                      {listen.cover_url ? (
                        <img
                          src={listen.cover_url}
                          alt={listen.album_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm text-[#1DCFAA] opacity-20 font-serif">♪</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#c0cdc8] font-serif truncate group-hover:text-[#f0ede8] transition-colors">
                        {listen.album_title}
                      </p>
                      <p className="text-[11px] text-[#3a4a48] font-serif truncate">
                        {listen.artist_name}
                      </p>
                    </div>

                    {/* Rating */}
                    {listen.rating && (
                      <span className="text-[11px] text-[#1DCFAA] font-serif flex-shrink-0">
                        {'★'.repeat(listen.rating)}
                      </span>
                    )}

                    {/* First listen */}
                    {listen.first_listen && (
                      <span className="text-[9px] text-[#1DCFAA] border border-[#1DCFAA]/30 px-2 py-0.5 rounded-full font-serif uppercase tracking-wider flex-shrink-0">
                        First listen
                      </span>
                    )}

                    {/* Date */}
                    <span className="text-[10px] text-[#2a3838] font-serif flex-shrink-0">
                      {formatDate(listen.listened_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </section>

    </div>
  )
}