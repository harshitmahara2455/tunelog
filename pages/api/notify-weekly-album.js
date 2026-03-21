import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, phone')
    .not('phone', 'is', null)

  if (!profiles || profiles.length === 0) {
    return res.status(200).json({ message: 'No users with phone numbers' })
  }

  const results = []

  for (const profile of profiles) {
    try {
      // get user's logged artists with MBIDs
      const { data: listens } = await supabase
        .from('listens')
        .select('artist_name, artist_mbid, rating')
        .eq('user_id', profile.id)
        .not('artist_mbid', 'is', null)
        .order('rating', { ascending: false })
        .limit(5)

      // get already logged album IDs
      const { data: loggedAlbums } = await supabase
        .from('listens')
        .select('album_id')
        .eq('user_id', profile.id)

      const loggedIds = new Set(loggedAlbums?.map(l => l.album_id) || [])

      let albumMessage = ''

      if (listens && listens.length > 0) {
        // try ListenBrainz similar artists
        const topListen = listens[0]

        try {
          const lbRes = await fetch(
            `https://api.listenbrainz.org/1/lb-radio/artist/${topListen.artist_mbid}?mode=easy&max_similar_artists=5`
          )
          const lbData = await lbRes.json()
          const similarArtists = lbData?.payload?.jspf?.track || []

          for (const similar of similarArtists) {
            const artistMbid = similar?.identifier?.split('/')?.[4]
            if (!artistMbid) continue

            const mbRes = await fetch(
              `https://musicbrainz.org/ws/2/release-group?artist=${artistMbid}&type=album&limit=3&fmt=json`,
              { headers: { 'User-Agent': 'Tunelog/1.0 (notifications@tunelog.app)' } }
            )
            const mbData = await mbRes.json()
            const albums = mbData['release-groups'] || []

            const freshAlbum = albums.find(a => !loggedIds.has(a.id))
            if (freshAlbum) {
              const artist = freshAlbum['artist-credit']?.[0]?.artist?.name || 'Unknown'
              const year = freshAlbum['first-release-date']?.substring(0, 4) || ''
              albumMessage = `🎧 *Your weekly album from Tunelog*\n\n*${freshAlbum.title}*\nby ${artist}${year ? ` (${year})` : ''}\n\nBecause you love ${topListen.artist_name}, you might enjoy this.\n\nDiscuss it at tunelog.vercel.app`
              break
            }
          }
        } catch (e) {
          // ListenBrainz failed, use fallback
        }
      }

      if (!albumMessage) {
        albumMessage = `🎧 *Your weekly album from Tunelog*\n\nLog more albums with ratings to get personalised weekly recommendations!\n\ntunelog.vercel.app`
      }

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${profile.phone}`,
        body: albumMessage,
      })

      results.push({ username: profile.username, status: 'sent' })
    } catch (err) {
      results.push({ username: profile.username, status: 'failed', error: err.message })
    }
  }

  res.status(200).json({ success: true, results })
}