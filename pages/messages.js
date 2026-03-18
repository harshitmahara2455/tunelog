import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

export default function Messages() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setCurrentUser(session.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setCurrentProfile(profile)

      await fetchConversations(session.user.id)
    }
    init()
  }, [])

  async function fetchConversations(userId) {
    // get all messages involving this user
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (!msgs || msgs.length === 0) {
      setLoading(false)
      return
    }

    // get unique conversation partners
    const partnerIds = new Set()
    msgs.forEach(msg => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
      partnerIds.add(partnerId)
    })

    // fetch partner profiles
    const { data: partners } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [...partnerIds])

    // build conversation list with last message and unread count
    const convos = [...partnerIds].map(partnerId => {
      const partner = partners?.find(p => p.id === partnerId)
      const convoMsgs = msgs.filter(m =>
        (m.sender_id === userId && m.receiver_id === partnerId) ||
        (m.sender_id === partnerId && m.receiver_id === userId)
      )
      const lastMsg = convoMsgs[0]
      const unread = convoMsgs.filter(m => m.sender_id === partnerId && !m.read).length

      return { partner, lastMsg, unread }
    })

    // sort by last message time
    convos.sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))
    setConversations(convos)
    setLoading(false)
  }

  function formatTime(timestamp) {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="live-dot w-2 h-2 rounded-full bg-[#1DCFAA]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#2a3838] font-serif">
            Loading messages...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">
      <Navbar user={currentUser} profile={currentProfile} onLogout={handleLogout} />

      <main className="px-16 lg:px-28 py-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#1DCFAA] mb-4 font-bold font-serif">
            Inbox
          </p>
          <h1
            className="font-normal font-serif leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(2rem, 3vw, 3rem)' }}
          >
            Your<br />
            <em className="text-[#1DCFAA] italic">conversations.</em>
          </h1>
        </motion.div>

        {/* Empty state */}
        {conversations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-5"
          >
            <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
            <p className="text-[14px] text-[#3a4a48] font-serif text-center">
              No conversations yet
            </p>
            <p className="text-[12px] text-[#2a3838] font-serif text-center max-w-sm">
              Follow someone and ask them to follow you back — then you can message each other
            </p>
            <Link href="/search">
              <button className="bg-[#1DCFAA] text-[#050505] px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all border-none cursor-pointer font-serif mt-2">
                Find people
              </button>
            </Link>
          </motion.div>
        )}

        {/* Conversations list */}
        {conversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl"
          >
            <div className="bg-[#0d1614] border border-white/[0.04] rounded-2xl overflow-hidden">
              {conversations.map((convo, i) => (
                <Link
                  key={convo.partner?.id}
                  href={`/chat/${convo.partner?.username}`}
                  className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0"
                    style={{ background: '#1a3a38', color: '#1DCFAA' }}
                  >
                    {convo.partner?.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] text-[#c0cdc8] font-serif group-hover:text-[#f0ede8] transition-colors">
                        {convo.partner?.username}
                      </p>
                      <span className="text-[10px] text-[#2a3838] font-serif">
                        {formatTime(convo.lastMsg.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-[#3a4a48] font-serif truncate max-w-xs">
                        {convo.lastMsg.sender_id === currentUser?.id ? 'You: ' : ''}
                        {convo.lastMsg.content}
                      </p>
                      {convo.unread > 0 && (
                        <div className="w-5 h-5 rounded-full bg-[#1DCFAA] flex items-center justify-center flex-shrink-0 ml-2">
                          <span className="text-[9px] text-[#050505] font-bold">
                            {convo.unread}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}