import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setLoading(false)
        return
      }

      setUser(session.user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-purple-500">Tunelog</h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-400 text-sm">
                Hey, <span className="text-white font-medium">{profile?.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition">
                Log in
              </Link>
              <Link href="/signup" className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex items-center justify-center mt-32">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-4">
            Music worth <span className="text-purple-500">talking about</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Discover albums. Share thoughts. Find your people.
          </p>
          {!user && (
            <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition">
              Get started
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}