/**
 * Storage abstraction.
 * - Local dev  : filesystem under public/uploads/clients/ (served as static assets)
 * - Production : Vercel Blob (public HTTPS URLs, Meta can fetch them directly)
 *
 * Detection: if BLOB_READ_WRITE_TOKEN is set → use Vercel Blob.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { nanoid } from 'nanoid'

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'clients')
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png':  '.png',
    'image/webp': '.webp',
    'image/gif':  '.gif',
    'image/svg+xml': '.svg',
    'video/mp4':  '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'text/markdown': '.md',
  }
  return map[mime] || '.bin'
}

// ─── Vercel Blob (production) ─────────────────────────────────────────────────

async function blobPut(
  pathname: string,
  body: Buffer | ArrayBuffer,
  contentType: string
): Promise<string> {
  const { put } = await import('@vercel/blob')
  const blob = await put(pathname, body, {
    access: 'public',
    contentType,
  })
  return blob.url
}

// ─── Local filesystem (dev) ───────────────────────────────────────────────────

async function localSave(
  clientId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const clientDir = path.join(UPLOAD_ROOT, clientId)
  if (!existsSync(clientDir)) {
    await mkdir(clientDir, { recursive: true })
  }
  await writeFile(path.join(clientDir, filename), buffer)
  return `/uploads/clients/${clientId}/${filename}`
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function saveClientFile(
  clientId: string,
  file: File
): Promise<{ filename: string; url: string; sizeBytes: number; mimeType: string }> {
  const ext = path.extname(file.name) || extFromMime(file.type)
  const filename = `${nanoid(16)}${ext}`
  const mimeType = file.type || 'application/octet-stream'
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const url = USE_BLOB
    ? await blobPut(`clients/${clientId}/${filename}`, buffer, mimeType)
    : await localSave(clientId, filename, buffer)

  return { filename, url, sizeBytes: buffer.length, mimeType }
}

export async function saveClientBuffer(input: {
  clientId: string
  buffer: Buffer
  mimeType: string
  ext?: string
}): Promise<{ filename: string; url: string; sizeBytes: number; mimeType: string }> {
  const filename = `${nanoid(16)}${input.ext || extFromMime(input.mimeType)}`

  const url = USE_BLOB
    ? await blobPut(`clients/${input.clientId}/${filename}`, input.buffer, input.mimeType)
    : await localSave(input.clientId, filename, input.buffer)

  return { filename, url, sizeBytes: input.buffer.length, mimeType: input.mimeType }
}
