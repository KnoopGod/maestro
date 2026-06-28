/**
 * Server-side upload content validation.
 *
 * The browser-declared `file.type` (multipart Content-Type) is attacker-controlled,
 * so we never trust it alone. We sniff the real magic bytes and verify they match
 * the declared MIME. SVG is text-based (no magic bytes) and can carry executable
 * scripts, so it gets a dedicated content check that rejects active content
 * (stored-XSS prevention).
 */

type Signature = { offset: number; bytes: number[] }

// Magic-byte signatures keyed by MIME. A file passes only if ALL of its entries match.
const SIGNATURES: Record<string, Signature[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png':  [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif':  [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }], // GIF8
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
  ],
  'video/mp4':       [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }], // ....ftyp
  'video/quicktime': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }], // ....ftyp
  'video/webm':      [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }], // PK.. (zip container)
}

// Types with no reliable binary signature — validated by other means.
const TEXT_MIMES = new Set(['text/plain', 'text/markdown'])
const SVG_MIME = 'image/svg+xml'

// SVG active-content patterns → reject.
const SVG_DANGEROUS = /<script[\s>]|<foreignObject[\s>]|\son\w+\s*=|javascript:|<!ENTITY/i

function matchesSignature(bytes: Uint8Array, sig: Signature): boolean {
  for (let i = 0; i < sig.bytes.length; i++) {
    if (bytes[sig.offset + i] !== sig.bytes[i]) return false
  }
  return true
}

/**
 * Returns null if the file content is consistent with `declaredMime`,
 * or a human-readable error string (French, UI-facing) if it must be rejected.
 */
export async function validateUploadContent(file: File, declaredMime: string): Promise<string | null> {
  // SVG: text-based, sniff for active content rather than magic bytes.
  if (declaredMime === SVG_MIME) {
    const text = await file.text()
    if (SVG_DANGEROUS.test(text)) {
      return 'SVG contenant du contenu actif (script) refusé.'
    }
    if (!/<svg[\s>]/i.test(text)) return 'Fichier SVG invalide.'
    return null
  }

  // Plain text / markdown: no binary signature. Served as text with an
  // extension forced from the validated MIME, so no executable-content risk.
  if (TEXT_MIMES.has(declaredMime)) return null

  const sigs = SIGNATURES[declaredMime]
  if (!sigs) return `Type de fichier non supporté pour la validation : ${declaredMime}`

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const ok = sigs.every(sig => matchesSignature(header, sig))
  if (!ok) {
    return `Le contenu du fichier ne correspond pas au type déclaré (${declaredMime}).`
  }
  return null
}
