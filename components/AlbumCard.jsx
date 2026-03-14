import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function AlbumCard({ title, artist, year, mbid, index = 0 }) {
  const [coverError, setCoverError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={mbid ? `/album/${mbid}` : `/search?q=${encodeURIComponent(title)}`}
        className="no-underline block group"
      >
        <div className="relative aspect-square rounded-lg mb-2.5 border border-[#1e2e2c] overflow-hidden bg-[#111a18] group-hover:border-[#1DCFAA33] transition-colors">
          {mbid && !coverError ? (
            <img
              src={`https://coverartarchive.org/release-group/${mbid}/front-250`}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setCoverError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl opacity-20 text-[#1DCFAA]">♪</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#1DCFAA06] opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Play hint */}
          <div className="absolute bottom-2 right-2 w-7 h-7 bg-[#1DCFAA] rounded-full flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#0a0a0a">
              <path d="M5 3l14 9-14 9V3z"/>
            </svg>
          </div>
        </div>

        <p className="text-xs text-[#c0cdc8] mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {title}
        </p>
        <p className="text-[10px] text-[#3a4a48]">
          {artist}{year ? ` · ${year}` : ''}
        </p>
      </Link>
    </motion.div>
  )
}