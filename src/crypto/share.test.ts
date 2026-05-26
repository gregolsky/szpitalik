import { describe, it, expect } from 'vitest'
import { encryptShare, decryptShare } from './share'

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

describe('encryptShare / decryptShare', () => {
  it('round-trip succeeds with correct password', async () => {
    const data = new TextEncoder().encode('hello world test payload')
    const password = 'test-password-123'
    const encrypted = await encryptShare(data, password)
    const decrypted = await decryptShare(encrypted, password)
    expect(new TextDecoder().decode(decrypted)).toBe('hello world test payload')
  })

  it('throws on wrong password', async () => {
    const data = new TextEncoder().encode('secret')
    const encrypted = await encryptShare(data, 'correct')
    await expect(decryptShare(encrypted, 'wrong')).rejects.toThrow()
  })

  it('produces different output each call (random IV/salt)', async () => {
    const data = new TextEncoder().encode('same data')
    const pw = 'pw'
    const enc1 = await encryptShare(data, pw)
    const enc2 = await encryptShare(data, pw)
    expect(toHex(enc1)).not.toBe(toHex(enc2))
  })
})
