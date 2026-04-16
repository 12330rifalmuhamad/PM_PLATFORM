import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || 'default_secret_key_32_char_long!' // Must be 256 bits (32 characters)
const IV_LENGTH = 16 // For AES, this is always 16

/**
 * Encrypts a plain text string
 * Returns format: "iv:encryptedData" (hex)
 */
export function encrypt(text) {
  if (!text) return text
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  } catch (error) {
    console.error('Encryption failed:', error)
    return text // Fallback to plain text if encryption fails
  }
}

/**
 * Decrypts an encrypted hex string in format "iv:encryptedData"
 * If format is invalid or decryption fails, returns original text (fallback for old messages)
 */
export function decrypt(text) {
  if (!text || !text.includes(':')) return text
  
  try {
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString()
  } catch (error) {
    // If it fails, it's likely not an encrypted message (or wrong key), so return as is
    return text
  }
}
