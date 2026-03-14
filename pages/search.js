import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const res = await fetch(
      `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(query)}&type=album&limit=12&fmt=json`,
      {
        headers: {
          'User-Agent': 'Tunelog/1.0 (your@email.com)'
        }
      }
    )

    const data = await res.json()
    setResults(data['release-groups'] || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-purple-500">Tunelog</Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-8">Search Albums</h2>

        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for an album..."
            className="flex-1 bg-gray-900 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searched && results.length === 0 && !loading && (
          <p className="text-gray-400">No albums found. Try a different search.</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.id}`}
              className="bg-gray-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition"
            >
              <div className="aspect-square bg-gray-800 flex items-center justify-center">
                <AlbumCover mbid={album.id} title={album.title} />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{album.title}</p>
                <p className="text-gray-400 text-xs truncate mt-1">
                  {album['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'}
                </p>
                {album['first-release-date'] && (
                  <p className="text-gray-600 text-xs mt-1">
                    {album['first-release-date'].substring(0, 4)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

function AlbumCover({ mbid, title }) {
  const [src, setSrc] = useState(
    `https://coverartarchive.org/release-group/${mbid}/front-250`
  )

  return (
    <img
      src={src}
      alt={title}
      className="w-full h-full object-cover"
      onError={() => setSrc('/placeholder.png')}
    />
  )
}