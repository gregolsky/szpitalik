import { base64urlEncode, base64urlDecode } from '@/utils/base64'
import type { Unit, Plan } from '@/types'
import { SCHEMA_VERSION } from '@/types'

const PBKDF2_ITERATIONS = 200_000
const SALT_LEN = 16
const IV_LEN = 12

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream('gzip')
  const writer = stream.writable.getWriter()
  await writer.write(data as unknown as Uint8Array<ArrayBuffer>)
  await writer.close()
  const chunks: Uint8Array[] = []
  const reader = stream.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value as Uint8Array)
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream('gzip')
  const writer = stream.writable.getWriter()
  await writer.write(data as unknown as Uint8Array<ArrayBuffer>)
  await writer.close()
  const chunks: Uint8Array[] = []
  const reader = stream.readable.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value as Uint8Array)
  }
  const total = chunks.reduce((acc, c) => acc + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptShare(plaintext: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN))
  const key = await deriveKey(password, salt)
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as unknown as ArrayBuffer }, key, plaintext as unknown as ArrayBuffer))
  const result = new Uint8Array(SALT_LEN + IV_LEN + ciphertext.length)
  result.set(salt, 0)
  result.set(iv, SALT_LEN)
  result.set(ciphertext, SALT_LEN + IV_LEN)
  return result
}

export async function decryptShare(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  const salt = bytes.slice(0, SALT_LEN)
  const iv = bytes.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const ciphertext = bytes.slice(SALT_LEN + IV_LEN)
  const key = await deriveKey(password, salt)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as ArrayBuffer }, key, ciphertext as unknown as ArrayBuffer)
  return new Uint8Array(plain)
}

export interface SharePayload {
  schemaVersion: typeof SCHEMA_VERSION
  unit: Unit
  plan: Plan
}

export async function encodeShareLink(unit: Unit, plan: Plan, password: string): Promise<string> {
  const payload: SharePayload = { schemaVersion: SCHEMA_VERSION, unit, plan }
  const enc = new TextEncoder()
  const json = enc.encode(JSON.stringify(payload))
  const compressed = await compress(json)
  const encrypted = await encryptShare(compressed, password)
  return base64urlEncode(encrypted)
}

export async function decodeShareLink(token: string, password: string): Promise<SharePayload> {
  const bytes = base64urlDecode(token)
  const decrypted = await decryptShare(bytes, password)
  const decompressed = await decompress(decrypted)
  const dec = new TextDecoder()
  return JSON.parse(dec.decode(decompressed)) as SharePayload
}
