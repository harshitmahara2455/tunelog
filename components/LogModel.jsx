import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function LogModal({ album, user, onClose, onLogged }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [firstListen, setFirstListen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState(null)
  const [checkingExisting, setCheckingExisting] = useState(true)

  useEffect(() => {
    checkExisting()
  }, [])

  async function checkExisting() {
    const { data } = await supabase
      .from('listens')
      .select('*')
      .eq('user_id', user.id)
      .eq('album_id', album.id)
      .single()

    if (data) {
      setExisting(data)
      setRating(data.rating || 0)
      setFirstListen(data.first_listen || false)
    }
    setCheckingExisting(false)
  }

  async function handleLog() {
  if (loading) return
  setLoading(true)

const payload = {
  user_id: user.id,
  album_id: album.id,
  album_title: album.title,
  artist_name: album.artistName,
  artist_mbid: album.artistMbid || null,
  cover_url: album.coverUrl || null,
  rating: rating || null,
  first_listen: firstListen,
}
  console.log('Saving payload:', payload)

  if (existing) {
    const { data, error } = await supabase
      .from('listens')
      .update(payload)
      .eq('user_id', user.id)
      .eq('album_id', album.id)
    console.log('Update result:', data, error)
  } else {
    const { data, error } = await supabase
      .from('listens')
      .insert(payload)
    console.log('Insert result:', data, error)
  }

  setLoading(false)
  onLogged()
  onClose()
}

  async function handleRemove() {
    if (!existing || loading) return
    setLoading(true)
    await supabase
      .from('listens')
      .delete()
      .eq('user_id', user.id)
      .eq('album_id', album.id)
    setLoading(false)
    onLogged()
    onClose()
  }

  const displayRating = hoverRating || rating

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0d1614] border border-white/[0.08] rounded-2xl p-8 w-full"
          style={{ maxWidth: '440px' }}
          onClick={e => e.stopPropagation()}
        >
          {checkingExisting ? (
            <div className="flex items-center justify-center py-8">
              <div className="live-dot w-1.5 h-1.5 rounded-full bg-[#1DCFAA]" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start gap-4 mb-8">
                <div
                  className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.06]"
                  style={{ background: '#111a18' }}
                >
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl text-[#1DCFAA] opacity-20">♪</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#1DCFAA] mb-1 font-serif">
                    {existing ? 'Update log' : 'Log album'}
                  </p>
                  <p className="text-[15px] text-[#f0ede8] font-serif truncate">{album.title}</p>
                  <p className="text-[12px] text-[#5a6b6a] font-serif">{album.artistName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-[#3a4a48] hover:text-[#6b7b7a] transition-colors bg-transparent border-none cursor-pointer text-xl leading-none mt-0.5"
                >
                  ×
                </button>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#3a5452] mb-4 font-serif">
                  Your rating
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(rating === star ? 0 : star)}
                      className="bg-transparent border-none cursor-pointer p-1 transition-transform hover:scale-110"
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill={displayRating >= star ? '#1DCFAA' : 'none'}
                        stroke={displayRating >= star ? '#1DCFAA' : '#2a3838'}
                        strokeWidth="1.5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-[12px] text-[#3a5452] font-serif ml-2">
                      {['', 'Poor', 'Fair', 'Good', 'Great', 'Perfect'][rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* First listen toggle */}
              <div className="mb-8">
                <button
                  onClick={() => setFirstListen(!firstListen)}
                  className="flex items-center gap-3 bg-transparent border-none cursor-pointer p-0 group"
                >
                  <div
                    className="w-9 h-5 rounded-full transition-colors relative flex-shrink-0"
                    style={{ background: firstListen ? '#1DCFAA' : '#1a2828' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: firstListen ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#c0cdc8] font-serif text-left">First listen</p>
                    <p className="text-[10px] text-[#3a4a48] font-serif text-left">
                      Mark this as your first time hearing it
                    </p>
                  </div>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLog}
                  disabled={loading}
                  className="flex-1 bg-[#1DCFAA] text-[#050505] py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 border-none cursor-pointer font-serif"
                >
                  {loading ? 'Saving...' : existing ? 'Update' : 'Log it'}
                </button>
                {existing && (
                  <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-5 py-3 rounded-full text-[11px] uppercase tracking-[0.2em] text-red-400 border border-red-900/30 hover:bg-red-950/30 transition-all bg-transparent cursor-pointer font-serif disabled:opacity-40"
                  >
                    Remove
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}