import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // security check — only allow cron calls
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  // get all users with phone numbers
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
      // get user's logged artists
      const { data: listens } = await supabase
        .from('listens')
        .select('artist_name, album_title, rating')
        .eq('user_id', profile.id)
        .order('rating', { ascending: false })
        .limit(10)

      let songMessage = ''

      if (listens && listens.length > 0) {
        // pick a random artist from their top listens
        const topArtist = listens[Math.floor(Math.random() * Math.min(5, listens.length))]

        // search MusicBrainz for a track by that artist
        const res2 = await fetch(
          `https://musicbrainz.org/ws/2/recording?query=artist:${encodeURIComponent(topArtist.artist_name)}&limit=10&fmt=json`,
          { headers: { 'User-Agent': 'Tunelog/1.0 (notifications@tunelog.app)' } }
        )
        const data = await res2.json()
        const recordings = data.recordings || []

        if (recordings.length > 0) {
          const pick = recordings[Math.floor(Math.random() * recordings.length)]
          const artistName = pick['artist-credit']?.[0]?.artist?.name || topArtist.artist_name
          songMessage = `🎵 *Your daily song from Tunelog*\n\n*${pick.title}*\nby ${artistName}\n\nBased on your love for ${topArtist.artist_name}.\n\nDiscover more at tunelog.vercel.app`
        }
      }

      if (!songMessage) {
        // fallback message
        songMessage = `🎵 *Your daily song from Tunelog*\n\nLog more albums to get personalised song recommendations!\n\ntunelog.vercel.app`
      }

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${profile.phone}`,
        body: songMessage,
      })

      results.push({ username: profile.username, status: 'sent' })
    } catch (err) {
      results.push({ username: profile.username, status: 'failed', error: err.message })
    }
  }

  res.status(200).json({ success: true, results })
}