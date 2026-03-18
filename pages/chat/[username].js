import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../../components/Navbar'
import { supabase } from '../../lib/supabase'

export default function ChatPage() {
  const router = useRouter()
  const { username } = router.query
  const [currentUser, setCurrentUser] = useState(null)
  const [currentProfile, setCurrentProfile] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [canChat, setCanChat] = useState(false)
  const bottomRef = useRef(null)

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

      // fetch other user
      const { data: other } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!other) { setLoading(false); return }
      setOtherUser(other)

      // check mutual follow — both must follow each other to chat
      const { data: iFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', other.id)
        .single()

      const { data: theyFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', other.id)
        .eq('following_id', session.user.id)
        .single()

      const mutualFollow = !!iFollow && !!theyFollow
      setCanChat(mutualFollow)

      if (mutualFollow) {
        await fetchMessages(session.user.id, other.id)

        // mark messages as read
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('sender_id', other.id)
          .eq('receiver_id', session.user.id)
          .eq('read', false)

        // realtime subscription
        const channel = supabase
          .channel(`chat:${[session.user.id, other.id].sort().join(':')}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
            },
            () => fetchMessages(session.user.id, other.id)
          )
          .subscribe()

        setLoading(false)
        return () => supabase.removeChannel(channel)
      }

      setLoading(false)
    }
    if (username) init()
  }, [username])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages(userId, otherId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!content.trim() || sending) return
    setSending(true)

    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content: content.trim(),
    })

    setContent('')
    setSending(false)
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function groupMessagesByDate(messages) {
    const groups = []
    let currentDate = null

    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ type: 'date', label: formatDate(msg.created_at) })
      }
      groups.push({ type: 'message', ...msg })
    })
    return groups
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
            Loading chat...
          </p>
        </div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[2rem] text-[#1a2828] font-serif mb-4">◎</p>
          <p className="text-[13px] text-[#3a4a48] font-serif">User not found.</p>
          <Link href="/" className="text-[11px] text-[#1DCFAA] mt-4 block">Go home →</Link>
        </div>
      </div>
    )
  }

  // not mutual follow — can't chat
  if (!canChat) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif">
        <Navbar user={currentUser} profile={currentProfile} onLogout={handleLogout} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
          <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
          <h2 className="text-[1.5rem] font-normal font-serif">You can't message {otherUser.username} yet</h2>
          <p className="text-[13px] text-[#3a4a48] font-serif text-center max-w-sm">
            You both need to follow each other to start a conversation.
            Follow them and ask them to follow you back.
          </p>
          <Link href={`/profile/${otherUser.username}`}>
            <button className="bg-[#1DCFAA] text-[#050505] px-7 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all border-none cursor-pointer font-serif">
              Go to their profile
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const grouped = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-[#050505] text-[#f0ede8] font-serif flex flex-col">

      <Navbar user={currentUser} profile={currentProfile} onLogout={handleLogout} />

      {/* ── CHAT HEADER ──────────────────────────────────────── */}
      <div className="px-16 lg:px-28 py-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/profile/${otherUser.username}`}
            className="text-[11px] text-[#3a5452] hover:text-[#1DCFAA] transition-colors font-serif tracking-wider"
          >
            ← Back to profile
          </Link>
          <span className="text-[#1a2828]">·</span>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ background: '#1a3a38', color: '#1DCFAA' }}
            >
              {otherUser.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[13px] text-[#f0ede8] font-serif">{otherUser.username}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot w-1.5 h-1.5 rounded-full bg-[#1DCFAA]" />
          <span className="text-[10px] text-[#1DCFAA] font-serif tracking-wider">
            Mutual followers
          </span>
        </div>
      </div>

      {/* ── MESSAGES ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-16 lg:px-28 py-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-32">
            <p className="text-[2rem] text-[#1a2828] font-serif">◎</p>
            <p className="text-[13px] text-[#3a4a48] font-serif">
              Start the conversation — talk music with {otherUser.username}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-w-2xl mx-auto">
            {grouped.map((item, i) => {
              if (item.type === 'date') {
                return (
                  <div key={i} className="flex items-center justify-center my-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#2a3838] font-serif">
                      {item.label}
                    </span>
                  </div>
                )
              }

              const isMe = item.sender_id === currentUser?.id
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  {/* Avatar for other user */}
                  {!isMe && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mr-2 mt-auto mb-1"
                      style={{ background: '#1a3a38', color: '#1DCFAA' }}
                    >
                      {otherUser.username?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-xs lg:max-w-md ${
                        isMe
                          ? 'bg-[#1DCFAA] text-[#050505] rounded-br-sm'
                          : 'bg-[#0d1614] border border-white/[0.06] text-[#f0ede8] rounded-bl-sm'
                      }`}
                    >
                      <p className="text-[13px] font-serif leading-relaxed">{item.content}</p>
                    </div>
                    <span className="text-[9px] text-[#2a3838] font-serif mt-1 px-1">
                      {formatTime(item.created_at)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── MESSAGE INPUT ────────────────────────────────────── */}
      <div className="px-16 lg:px-28 py-6 border-t border-white/[0.04] flex-shrink-0">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-4 max-w-2xl mx-auto"
        >
          <div className="flex-1 flex items-center gap-3 bg-[#0d1614] border border-white/[0.06] rounded-full px-5 py-3 hover:border-[#1DCFAA22] transition-colors">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Message ${otherUser.username}...`}
              className="flex-1 bg-transparent border-none outline-none text-[#f0ede8] text-[13px] font-serif placeholder-[#2a3838]"
              style={{ caretColor: '#1DCFAA' }}
            />
          </div>
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="bg-[#1DCFAA] text-[#050505] w-11 h-11 rounded-full flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 border-none cursor-pointer flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#050505">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </form>
      </div>

    </div>
  )
}