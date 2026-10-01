

// ---- gap2d tools:

// The three tools on this server are a local heuristic, and they say so: their
// own coverage field lists "common confusable examples" and "selected invisible
// controls". These answer the same questions against Unicode's own published
// data instead - the UCD and the TR39 confusables table - so a reviewer can check
// the heuristic against the source.
//
// Only a code point leaves the machine. The server promises that input is never
// sent anywhere, and these three keep it: the caller supplies one code point and
// the two data files are fetched once and cached, never the caller's text.

const UCD_DATA_URL = 'https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt'
const TR39_CONFUSABLES_URL = 'https://www.unicode.org/Public/security/latest/confusables.txt'
const UNICODE_UA = 'mrfentmen-unicode-security-mcp/1.0 (https://github.com/mrfentmen)'

interface UcdRecord {
  name: string
  category: string
  combiningClass: number
  bidiClass: string
  decomposition: string
}

// Module-level caches are `const` holders rather than `let` bindings, so the
// table is fetched once per process and never re-downloaded between calls.
const unicodeDataCache: { records: Map<number, UcdRecord> | null } = { records: null }
const confusablesCache: { table: Map<number, number> | null } = { table: null }

async function unicodeFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UNICODE_UA, Accept: 'text/plain' },
    signal: AbortSignal.timeout(60000),
  })
  if (!res.ok) throw new Error(`unicode.org returned ${res.status} for ${url}`)
  return await res.text()
}

/** "U+1F600", "1F600", "0x1f600" or a single character all mean the same thing. */
function parseCodePoint(value: string): number | null {
  const raw = (value ?? '').trim()
  if (!raw) return null
  if ([...raw].length === 1) return raw.codePointAt(0) ?? null
  const hex = raw.replace(/^(?:u\+|U\+|0x)/, '').replace(/^0+/, '') || '0'
  if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) return null
  const code = parseInt(hex, 16)
  return code >= 0 && code <= 0x10ffff ? code : null
}

function hexOf(code: number): string {
  return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`
}

async function ucdRecords(): Promise<Map<number, UcdRecord>> {
  if (unicodeDataCache.records) return unicodeDataCache.records
  const body = await unicodeFetch(UCD_DATA_URL)
  const records = new Map<number, UcdRecord>()
  for (const line of body.split('\n')) {
    if (!line || line.startsWith('#')) continue
    const parts = line.split(';')
    if (parts.length < 6) continue
    const code = parseInt(parts[0], 16)
    if (!Number.isFinite(code)) continue
    // <control, First> / <control, Last> range markers carry no real name.
    if (parts[1].startsWith('<') && parts[1].endsWith('First>')) continue
    records.set(code, {
      name: parts[1].startsWith('<') ? `unnamed control in the range ending at ${parts[0]}` : parts[1],
      category: parts[2],
      combiningClass: Number(parts[3]) || 0,
      bidiClass: parts[4],
      decomposition: parts[5],
    })
  }
  unicodeDataCache.records = records
  return records
}

async function tr39Table(): Promise<Map<number, number>> {
  if (confusablesCache.table) return confusablesCache.table
  const body = await unicodeFetch(TR39_CONFUSABLES_URL)
  const table = new Map<number, number>()
  for (const line of body.split('\n')) {
    const data = line.split('#')[0].trim()
    if (!data) continue
    const parts = data.split(';').map((p) => p.trim())
    if (parts.length < 2) continue
    const from = parseInt(parts[0], 16)
    const to = parseInt(parts[1], 16)
    if (Number.isFinite(from) && Number.isFinite(to)) table.set(from, to)
  }
  confusablesCache.table = table
  return table
}

/** The official UCD record for one code point. */
export async function codePointInfo(args: { codePoint: string }): Promise<string> {
  const code = parseCodePoint(args.codePoint ?? '')
  if (code === null) return 'Provide one code point, e.g. "0430", "U+0430" or the character itself.'
  const records = await ucdRecords()
  const record = records.get(code)
  if (!record) return `${hexOf(code)} is not assigned in the Unicode Character Database.`
  const lines = [
    `${hexOf(code)}  ${String.fromCodePoint(code)}`,
    `Name: ${record.name}`,
    `General category: ${record.category}`,
    `Canonical combining class: ${record.combiningClass}`,
    `Bidirectional category: ${record.bidiClass}`,
  ]
  const table = await tr39Table()
  const skeleton = table.get(code)
  if (skeleton !== undefined) {
    lines.push(`TR39 confusable skeleton: ${hexOf(skeleton)}  ${String.fromCodePoint(skeleton)}`)
  } else {
    lines.push('TR39 confusable skeleton: not in the table (it stands for itself)')
  }
  return lines.join('\n')
}

/** The canonical and compatibility decompositions Unicode records for a code point. */
export async function characterDecomposition(args: { codePoint: string }): Promise<string> {
  const code = parseCodePoint(args.codePoint ?? '')
  if (code === null) return 'Provide one code point, e.g. "FB01" or "U+FB01".'
  const records = await ucdRecords()
  const record = records.get(code)
  if (!record) return `${hexOf(code)} is not assigned in the Unicode Character Database.`
  const lines = [`${hexOf(code)}  ${String.fromCodePoint(code)}  (${record.name})`]
  if (!record.decomposition) {
    lines.push('Decomposition: none recorded (this code point is a starter).')
    return lines.join('\n')
  }
  const parts = record.decomposition.trim().split(/\s+/)
  const kind = parts[0].startsWith('<') ? parts.shift()! : 'canonical'
  const codes = parts.map((p) => parseInt(p, 16)).filter((n) => Number.isFinite(n))
  const show = (list: number[]) => list.map((c) => `${hexOf(c)}  ${String.fromCodePoint(c)}`).join('\n')
  lines.push(`Decomposition type: ${kind}`)
  lines.push(`Sequence of ${codes.length} code point(s):`)
  lines.push(show(codes))
  if (kind === 'canonical') {
    lines.push('Canonical decomposition is reversible by NFC, so NFC normalizes this back to the composed form.')
  } else {
    lines.push('Compatibility decomposition is NOT reversible: NFKC will not put this code point back together.')
  }
  return lines.join('\n')
}
