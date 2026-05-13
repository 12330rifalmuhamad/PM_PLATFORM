import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST || 'smtp.gmail.com'
const port = parseInt(process.env.SMTP_PORT || '587', 10)
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER || ''
const pass = process.env.SMTP_PASS || ''
const from = process.env.SMTP_FROM || '"Vuexy PMP System" <no-reply@example.com>'

let transporter = null

if (user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  })
}

/**
 * Sends a real email using SMTP transport.
 * Falls back gracefully if credentials are not configured in `.env`.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text version
 * @param {string} options.html - HTML version
 */
export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn('[EMAIL WARNING] SMTP credentials are not configured in .env. Skipping real email sending.')
    return { success: false, message: 'SMTP credentials not configured.' }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    })

    console.log('[EMAIL SUCCESS] Message sent: %s', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email:', error)
    return { success: false, error }
  }
}
