import '@testing-library/jest-dom'
import { IDBFactory } from 'fake-indexeddb'
import { webcrypto } from 'node:crypto'

Object.defineProperty(globalThis, 'indexedDB', {
  value: new IDBFactory(),
  writable: true,
})

Object.defineProperty(globalThis, 'crypto', {
  value: webcrypto,
  writable: true,
})

if (typeof CompressionStream === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).CompressionStream = class {
    readable: ReadableStream
    writable: WritableStream
    constructor(_format: string) {
      const t = new TransformStream()
      this.readable = t.readable
      this.writable = t.writable
    }
  }
}

if (typeof DecompressionStream === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).DecompressionStream = class {
    readable: ReadableStream
    writable: WritableStream
    constructor(_format: string) {
      const t = new TransformStream()
      this.readable = t.readable
      this.writable = t.writable
    }
  }
}
