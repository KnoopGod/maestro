/**
 * Extract text content from documents (PDF, DOCX, TXT, MD)
 * Used to feed the Visual Identity Card with brand guidelines.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export async function extractTextFromFile(
  filepath: string,
  mimeType: string
): Promise<string | null> {
  try {
    if (mimeType === 'application/pdf') {
      return await extractPdf(filepath)
    }
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return await extractDocx(filepath)
    }
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return await readFile(filepath, 'utf-8')
    }
    return null
  } catch (err) {
    console.error('[extract-text] error:', err)
    return null
  }
}

async function extractPdf(filepath: string): Promise<string> {
  // Dynamic import to avoid loading at build time
  // pdf-parse v2 exposes named or namespace export — handle both shapes
  const mod = await import('pdf-parse')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse: (b: Buffer) => Promise<{ text: string }> = (mod as any).default || (mod as any).pdf || (mod as any)
  const buffer = await readFile(filepath)
  const data = await pdfParse(buffer)
  return data.text.trim()
}

async function extractDocx(filepath: string): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ path: filepath })
  return result.value.trim()
}

export function getAbsolutePath(url: string): string {
  const base = path.join(process.cwd(), 'public', 'uploads', 'clients')
  const resolved = path.resolve(base, url.replace(/^\/uploads\/clients\//, ''))
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error('Chemin de fichier invalide')
  }
  return resolved
}
