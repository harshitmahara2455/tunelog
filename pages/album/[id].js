import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function AlbumPage() {
  const router = useRouter()
  const { id } = router.query
  const [album, setAlbum] = useState(null)
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [coverError, setCoverError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetchAlbum()
  }, [id])

  async function fetchAlbum() {
    setLoading(true)

    // fetch album details
    const albumRes = await fetch(
      `https://musicbrainz.org/ws/2/release-group/${id}?inc=artists+releases&fmt=json`,
      {
        headers: {
          'User-Agent': 'Tunelog/1.0 (your@email.com)'
        }
      }
    )
    const albumData = await albumRes.json()
    setAlbum(albumData)

    // fetch tracklist from first release
    if (albumData.releases?.[0]?.id) {
      const releaseId = albumData.releases[0].id
      const trackRes = await fetch(
        `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`,
        {
          headers: {
            'User-Agent': 'Tunelog/1.0 (your@email.com)'
          }
        }
      )
      const trackData = await trackRes.json()
      const media = trackData.media?.[0]?.tracks || []
      setTracks(media)
    }

    setLoading(false)
  }

  function formatDuration(ms) {
    if (!ms) return '--:--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading album...</p>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Album not found.</p>
      </div>
    )
  }

  const artistName = album['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
  const releaseYear = album['first-release-date']?.substring(0, 4) || ''
  const coverUrl = `https://coverartarchive.org/release-group/${id}/front-500`

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-purple-500">Tunelog</Link>
        <Link href="/search" className="text-sm text-gray-400 hover:text-white transition">
          Search
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Album header */}
        <div className="flex gap-8 mb-12">
          <div className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl overflow-hidden">
            {!coverError ? (
              <img
                src={coverUrl}
                alt={album.title}
                className="w-full h-full object-cover"
                onError={() => setCoverError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <span className="text-5xl">🎵</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-end">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Album</p>
            <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
            <p className="text-gray-300 text-lg">{artistName}</p>
            {releaseYear && (
              <p className="text-gray-500 mt-1">{releaseYear}</p>
            )}
          </div>
        </div>

        {/* Tracklist */}
        {tracks.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-200">Tracklist</h2>
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-800 transition border-b border-gray-800 last:border-0"
                >
                  <span className="text-gray-600 text-sm w-6 text-right">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm">{track.title}</span>
                  <span className="text-gray-500 text-sm">
                    {formatDuration(track.length)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments section placeholder */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 text-gray-200">Discussion</h2>
          <div className="bg-gray-900 rounded-xl p-6 text-center text-gray-500">
            Comments coming soon...
          </div>
        </div>
      </main>
    </div>
  )
}