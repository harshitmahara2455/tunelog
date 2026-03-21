import twilio from 'twilio'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${req.body.phone}`,
      body: '🎵 Tunelog test message — WhatsApp notifications are working!',
    })

    res.status(200).json({ success: true, sid: message.sid })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}