import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { nanoid } from 'nanoid'

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'clients')

export async function saveClientFile(
  clientId: string,
  file: File
): Promise<{ filename: string; url: string; sizeBytes: number; mimeType: string }> {
  const clientDir = path.join(UPLOAD_ROOT, clientId)
  if (!existsSync(clientDir)) {
    await mkdir(clientDir, { recursive: true })
  }

  const ext = path.extname(file.name) || extFromMime(file.type)
  const filename = `${nanoid(16)}${ext}`
  const filepath = path.join(clientDir, filename)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await writeFile(filepath, buffer)

  return {
    filename,
    url: `/uploads/clients/${clientId}/${filename}`,
    sizeBytes: buffer.length,
    mimeType: file.type || 'application/octet-stream',
  }
}

export async function saveClientBuffer(input: {
  clientId: string
  buffer: Buffer
  mimeType: string
  ext?: string
}): Promise<{ filename: string; url: string; sizeBytes: number; mimeType: string }> {
  const clientDir = path.join(UPLOAD_ROOT, input.clientId)
  if (!existsSync(clientDir)) {
    await mkdir(clientDir, { recursive: true })
  }

  const filename = `${nanoid(16)}${input.ext || extFromMime(input.mimeType)}`
  const filepath = path.join(clientDir, filename)

  await writeFile(filepath, input.buffer)

  return {
    filename,
    url: `/uploads/clients/${input.clientId}/${filename}`,
    sizeBytes: input.buffer.length,
    mimeType: input.mimeType,
  }
}

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
