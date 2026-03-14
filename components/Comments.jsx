import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function Comments({ albumId, user, profile }) {
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [likes, setLikes] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  useEffect(() => {
    fetchComments()
    if (user) fetchLikes()

    // realtime subscription
    const channel = supabase
      .channel(`comments:${albumId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `album_id=eq.${albumId}`,
        },
        (payload) => {
          fetchComments()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [albumId, user])

  async function fetchComments() {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (username)
      `)
      .eq('album_id', albumId)
      .order('created_at', { ascending: true })

    if (!error) setComments(data || [])
    setLoading(false)
  }

  async function fetchLikes() {
    const { data } = await supabase
      .from('likes')
      .select('comment_id')
      .eq('user_id', user.id)

    const likeMap = {}
    data?.forEach(l => { likeMap[l.comment_id] = true })
    setLikes(likeMap)
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!content.trim() || posting) return
    setPosting(true)

    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        album_id: albumId,
        content: content.trim(),
        parent_comment_id: null,
      })

    if (!error) {
      setContent('')
      fetchComments()
    }
    setPosting(false)
  }

  async function handleReply(e, parentId) {
    e.preventDefault()
    if (!replyContent.trim() || postingReply) return
    setPostingReply(true)

    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        album_id: albumId,
        content: replyContent.trim(),
        parent_comment_id: parentId,
      })

    if (!error) {
      setReplyContent('')
      setReplyingTo(null)
      fetchComments()
    }
    setPostingReply(false)
  }

  async function handleLike(commentId) {
    if (!user) return

    if (likes[commentId]) {
      // unlike
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
      setLikes(prev => { const n = { ...prev }; delete n[commentId]; return n })
    } else {
      // like
      await supabase
        .from('likes')
        .insert({ user_id: user.id, comment_id: commentId })
      setLikes(prev => ({ ...prev, [commentId]: true }))
    }
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

  // separate top level and replies
  const topLevel = comments.filter(c => !c.parent_comment_id)
  const replies = comments.filter(c => c.parent_comment_id)

  function getReplies(commentId) {
    return replies.filter(r => r.parent_comment_id === commentId)
  }

  function getLikeCount(commentId) {
    return replies.concat(topLevel).find(c => c.id === commentId)?.like_count || 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="live-dot w-1.5 h-1.5 rounded-full bg-[#1DCFAA]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── COMMENT FORM ─────────────────────────────────── */}
      {user ? (
        <form onSubmit={handlePost} className="bg-[#0d1614] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
              style={{ background: '#1a3a38', color: '#1DCFAA' }}
            >
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you think about this album..."
                className="w-full bg-transparent border-none outline-none text-[#f0ede8] text-[14px] font-serif placeholder-[#2a3838] resize-none leading-relaxed"
                style={{ caretColor: '#1DCFAA' }}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <span className="text-[11px] text-[#2a3838] font-serif">
                  {content.length > 0 ? `${content.length} chars` : ''}
                </span>
                <button
                  type="submit"
                  disabled={posting || !content.trim()}
                  className="bg-[#1DCFAA] text-[#050505] px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-30 border-none cursor-pointer font-serif"
                >
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-[#0d1614] border border-white/[0.06] rounded-2xl p-8 text-center">
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

      {/* ── COMMENTS LIST ────────────────────────────────── */}
      {topLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-[1.5rem] text-[#1a2828] font-serif">◎</p>
          <p className="text-[12px] text-[#3a4a48] font-serif">
            No comments yet — be the first
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {topLevel.map((comment, i) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Top level comment */}
              <CommentRow
                comment={comment}
                user={user}
                liked={!!likes[comment.id]}
                onLike={() => handleLike(comment.id)}
                onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                formatTime={formatTime}
              />

              {/* Reply form */}
              <AnimatePresence>
                {replyingTo === comment.id && user && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => handleReply(e, comment.id)}
                    className="ml-11 mt-2 mb-2 bg-[#0a1210] border border-white/[0.04] rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                        style={{ background: '#1a3a38', color: '#1DCFAA' }}
                      >
                        {profile?.username?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <textarea
                          rows={2}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Reply to ${comment.profiles?.username}...`}
                          className="w-full bg-transparent border-none outline-none text-[#f0ede8] text-[13px] font-serif placeholder-[#2a3838] resize-none"
                          style={{ caretColor: '#1DCFAA' }}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => { setReplyingTo(null); setReplyContent('') }}
                            className="text-[10px] text-[#3a4a48] hover:text-[#6b7b7a] transition-colors bg-transparent border-none cursor-pointer font-serif uppercase tracking-wider"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={postingReply || !replyContent.trim()}
                            className="bg-[#1DCFAA] text-[#050505] px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-30 border-none cursor-pointer font-serif"
                          >
                            {postingReply ? 'Posting...' : 'Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="ml-11 mt-2">
                  <CommentRow
                    comment={reply}
                    user={user}
                    liked={!!likes[reply.id]}
                    onLike={() => handleLike(reply.id)}
                    onReply={() => setReplyingTo(comment.id)}
                    formatTime={formatTime}
                    isReply
                  />
                </div>
              ))}

            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}

function CommentRow({ comment, user, liked, onLike, onReply, formatTime, isReply = false }) {
  return (
    <div className={`flex items-start gap-3 ${isReply ? 'py-2' : 'py-3'}`}>
      {/* Avatar */}
      <div
        className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
        style={{
          width: isReply ? '28px' : '34px',
          height: isReply ? '28px' : '34px',
          background: '#1a2a3a',
          color: '#5aafcf',
          fontSize: isReply ? '10px' : '12px',
        }}
      >
        {comment.profiles?.username?.[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[12px] text-[#c0cdc8] font-serif">
            {comment.profiles?.username}
          </span>
          <span className="text-[#1a2828] text-xs">·</span>
          <span className="text-[10px] text-[#2a3838] font-serif">
            {formatTime(comment.created_at)}
          </span>
        </div>

        {/* Content */}
        <p className="text-[13px] text-[#8a9b9a] font-serif leading-[1.75] mb-2">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider transition-colors bg-transparent border-none cursor-pointer font-serif ${
              liked ? 'text-[#1DCFAA]' : 'text-[#2a3838] hover:text-[#4a5a58]'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill={liked ? '#1DCFAA' : 'none'} stroke={liked ? '#1DCFAA' : '#2a3838'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {liked ? 'Liked' : 'Like'}
          </button>

          {!isReply && (
            <button
              onClick={onReply}
              className="text-[10px] uppercase tracking-wider text-[#2a3838] hover:text-[#4a5a58] transition-colors bg-transparent border-none cursor-pointer font-serif"
            >
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  )
}