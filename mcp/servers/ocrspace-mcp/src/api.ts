export class OcrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OcrError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OCRSPACE_API_KEY;
  if (!k) throw new OcrError("Set OCRSPACE_API_KEY (free OCR.space key).");
  return k;
}

async function call(url: string, init: RequestInit): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
  } catch (e) {
    throw new OcrError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new OcrError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function parseImageUrl(imageUrl: string, language?: string): Promise<string> {
  const q = new URLSearchParams({ apikey: key(), url: imageUrl });
  if (language) q.set("language", language);
  return call(`https://api.ocr.space/parse/imageurl?${q.toString()}`, { headers: { ...UA } });
}

export function parseImagePost(imageUrl: string, overlay?: string): Promise<string> {
  const body = new URLSearchParams({ apikey: key(), url: imageUrl, isOverlayRequired: overlay ?? "false" });
  return call("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

// ---- muxG tools:
const OCR_CLEAN_INPUT_MAX = 20000
const OCR_FIELDS_INPUT_MAX = 20000
const OCR_AUDIT_INPUT_MAX = 20000
const OCR_LIST_CAP = 40

function cleanBoundText(value: unknown, label: string): string {
  const s = String(value ?? "")
  if (!s.trim()) throw new OcrError(`${label} is empty. Paste the text the OCR tool returned.`)
  if (s.length > OCR_CLEAN_INPUT_MAX) {
    throw new OcrError(`${label} is ${s.length} characters, over the ${OCR_CLEAN_INPUT_MAX} limit. Send a slice of the document.`)
  }
  return s
}

function ocrClamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

const OCR_SPACE_MAP: Record<string, string> = {
  "\u00a0": " ", "\u2007": " ", "\u202f": " ", "\u2009": " ", "\u200a": " ",
  "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
  "\u2013": "-", "\u2014": "-", "\u2212": "-", "\u00ad": "",
}

function ocrFixPunctSpacing(s: string): { out: string; fixes: number } {
  let out = s
  let fixes = 0
  const before = out
  out = out.replace(/ +([,.;:!?%)\]}])/g, "$1")
  out = out.replace(/([(\[{]) +/g, "$1")
  out = out.replace(/([,;:])(?=[^\s\d])/g, "$1 ")
  out = out.replace(/([.!?])([A-Z])/g, "$1 $2")
  if (out !== before) fixes = 1
  return { out, fixes }
}

/**
 * Clean up the raw text an OCR engine returns: de-hyphenate words split across
 * line breaks, rejoin wrapped lines into their paragraphs, fix spacing around
 * punctuation and report exactly what changed.
 */
export async function ocrCleanup(args: { input?: string; keepBlankLines?: boolean }): Promise<string> {
  const raw = cleanBoundText(args?.input, "input")
  const originalChars = raw.length

  let replaced = 0
  let normalised = raw.replace(/[\u00a0\u2007\u202f\u2009\u200a\u2018\u2019\u201c\u201d\u2013\u2014\u2212\u00ad]/g, (m) => {
    replaced += 1
    return OCR_SPACE_MAP[m] ?? " "
  })
  normalised = normalised.replace(/\r\n?/g, "\n").replace(/\t/g, "  ")

  const rawLines = normalised.split("\n")
  const blocks: { kept: string[]; joined: number; hyphens: number }[] = []
  let current: string[] = []
  let joinedCount = 0
  let hyphenCount = 0

  const flush = (): void => {
    if (!current.length) return
    let acc = current[0]
    for (let i = 1; i < current.length; i += 1) {
      const line = current[i]
      if (/[A-Za-z\u00c0-\u024f]-$/.test(acc) && /^[a-z\u00c0-\u024f]/.test(line)) {
        acc = `${acc.slice(0, -1)}${line}`
        hyphenCount += 1
      } else {
        acc = `${acc} ${line}`
        joinedCount += 1
      }
    }
    blocks.push({ kept: [acc], joined: joinedCount, hyphens: hyphenCount })
    current = []
  }

  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed) {
      flush()
      continue
    }
    if (/^\d{1,4}$/.test(trimmed) && blocks.length) continue
    current.push(trimmed)
  }
  flush()

  const paragraphs = blocks.map((b) => b.kept[0])
  const spaced = paragraphs.map((p) => ocrFixPunctSpacing(p))
  const punctFixes = spaced.filter((s) => s.fixes === 1).length
  const body = spaced.map((s) => s.out.replace(/[ ]{2,}/g, " ").trim()).filter(Boolean)
  const cleaned = args?.keepBlankLines ? body.join("\n\n") : body.join("\n")

  const header = [
    "OCR text cleanup, done locally on the text you supplied",
    `Input ${originalChars} characters across ${rawLines.length} lines -> output ${cleaned.length} characters in ${body.length} paragraph(s)`,
    `Unicode spaces, quotes, dashes and soft hyphens replaced: ${replaced}`,
    `Words re-joined across a hyphenated line break: ${hyphenCount}`,
    `Wrapped lines re-joined into their paragraph: ${joinedCount}`,
    `Paragraphs whose punctuation spacing was corrected: ${punctFixes}`,
    `Bare page-number lines dropped: ${rawLines.filter((l) => /^\s*\d{1,4}\s*$/.test(l)).length}`,
    "",
  ]
  const preview = cleaned.slice(0, 2200)
  return [
    ...header,
    preview,
    cleaned.length > preview.length ? `... (${cleaned.length - preview.length} more characters of cleaned output)` : "",
  ].filter(Boolean).join("\n")
}

interface FieldHit {
  label: string
  value: string
  line: number
}

const OCR_FIELD_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "email", re: /[\w.+-]+@[\w-]+\.[\w.-]{2,}/g },
  { label: "url", re: /\bhttps?:\/\/[^\s"'<>()]{4,}/g },
  { label: "phone", re: /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{2,4})?/g },
  { label: "IBAN", re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
  { label: "date", re: /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/.]\d{1,2}[/.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi },
  { label: "percentage", re: /\b\d{1,3}(?:[.,]\d+)?\s?%/g },
  { label: "currency amount", re: /(?:[$€£¥]\s?\d[\d.,]*|\b\d[\d.,]*\s?(?:USD|EUR|GBP|CHF|DKK|SEK|NOK|JPY)\b)/g },
  { label: "VAT/GST number", re: /\b(?:VAT|GST|TVA|BTW|USt[-\s]?IdNr)[\s:#-]*([A-Z]{0,2}\d[\dA-Z\s]{5,14})\b/gi },
  { label: "invoice/tax number", re: /\b(?:invoice|inv\.?|factura|facture|receipt|tax number|order no\.?|purchase order)[\s:#-]*([A-Z0-9][A-Z0-9\-\/]{3,19})\b/gi },
  { label: "product code", re: /\b(?:sku|ean|upc|isbn|artikel|item)[\s:#-]*([A-Z0-9][A-Z0-9\-\/]{4,19})\b/gi },
]

/** Pull the labelled fields out of OCR text: the next step after recognising a document. */
export async function documentFields(args: { input?: string; only?: string }): Promise<string> {
  const raw = cleanBoundText(args?.input, "input")
  const lines = raw.split(/\r\n?|\n/)
  const want = args?.only ? String(args.only).toLowerCase().trim() : ""
  const hits: FieldHit[] = []

  for (const pattern of OCR_FIELD_PATTERNS) {
    if (want && !pattern.label.toLowerCase().includes(want)) continue
    for (let i = 0; i < lines.length; i += 1) {
      const re = new RegExp(pattern.re.source, pattern.re.flags.includes("g") ? pattern.re.flags : `${pattern.re.flags}g`)
      let m: RegExpExecArray | null
      while ((m = re.exec(lines[i])) !== null) {
        hits.push({ label: pattern.label, value: m[1] ?? m[0], line: i + 1 })
        if (m.index === re.lastIndex) re.lastIndex += 1
      }
    }
  }

  if (!hits.length) {
    return [
      "Document field extraction, done locally on the text you supplied",
      want ? `No field matching "${want}" was found.` : "No labelled field was recognised.",
      "Recognised field types: email, url, phone, IBAN, date, percentage, currency amount, VAT/GST number, invoice/tax number, product code.",
      "OCR text that lost its labels during recognition will not yield fields, so check the raw output first.",
    ].join("\n")
  }

  hits.sort((a, b) => a.line - b.line)
  const byLabel = new Map<string, number>()
  for (const h of hits) byLabel.set(h.label, (byLabel.get(h.label) ?? 0) + 1)

  return [
    "Document field extraction, done locally on the text you supplied",
    `Scanned ${lines.length} line(s) and found ${hits.length} field(s) across ${byLabel.size} type(s): ${[...byLabel.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}`,
    "",
    ...hits.slice(0, OCR_LIST_CAP).map((h) => `${String(h.line).padStart(4)} | ${h.label.padEnd(20)} | ${h.value}`),
    hits.length > OCR_LIST_CAP ? `... (${hits.length - OCR_LIST_CAP} further fields not shown)` : "",
    "",
    "Dates are reported exactly as they were recognised, so check the shape before trusting a day/month order.",
  ].filter(Boolean).join("\n")
}

const OCR_CONFUSIONS: { name: string; re: RegExp; note: string }[] = [
  { name: "rn read as m", re: /\b\w*rnm\w*\b/i, note: "an rn pair in the middle of a word is a classic m" },
  { name: "cl read as d", re: /\b\w*cld\w*\b/i, note: "cl and d are near-identical in most scan fonts" },
  { name: "vv read as w", re: /\b\w*vv\w*\b/i, note: "a double v is usually a w" },
  { name: "0 in a word", re: /\b[A-Za-z]{2,}[0-9]|[0-9][A-Za-z]{2,}\b/, note: "a digit inside a word is usually an OCR'd letter" },
  { name: "l I 1 confusion", re: /\b[Il1]{2,}\b/, note: "three near-identical glyphs, so the character is not trustworthy" },
  { name: "0 O confusion", re: /\b[O0]{2,}\b/, note: "letter O and digit zero differ only by width in many fonts" },
  { name: "S 5 confusion", re: /\b[^\d]*[S5][^\d]*[S5][^\d]*\b/, note: "S and 5 are a frequent pair in amount fields" },
  { name: "B 8 confusion", re: /\b[^\d]*[B8][^\d]*[B8][^\d]*\b/, note: "B and 8 are a frequent pair in reference numbers" },
  { name: "mixed digits and letters", re: /^(?=.*[A-Za-z])(?=.*\d)\S{4,}$/, note: "codes do this legitimately, so confirm against the source" },
  { name: "doubled word", re: /\b(\w{2,})\s+\1\b/i, note: "often a single word recognised twice across a line break" },
]

/** Flag the places where OCR character recognition is most likely to have gone wrong. */
export async function ocrConfusionAudit(args: { input?: string; limit?: number }): Promise<string> {
  const raw = cleanBoundText(args?.input, "input")
  const limit = ocrClamp(args?.limit, 1, OCR_LIST_CAP, 20)
  const lines = raw.split(/\r\n?|\n/)

  const found: { line: number; text: string; why: string[] }[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    const why: string[] = []
    for (const c of OCR_CONFUSIONS) {
      const re = new RegExp(c.re.source, c.re.flags.replace("g", ""))
      if (re.test(trimmed)) why.push(`${c.name} (${c.note})`)
    }
    if (why.length) found.push({ line: i + 1, text: trimmed, why })
  }

  const summary = [
    "OCR confusion audit, done locally on the text you supplied",
    `Checked ${lines.length} line(s) and flagged ${found.length} line(s) for the ${OCR_CONFUSIONS.length} most common recognition errors.`,
    "",
  ]

  if (!found.length) {
    return [
      ...summary,
      "Nothing flagged. That is not a proof the text is correct, only that it does not contain the shapes these errors usually leave behind.",
      "Always re-read a currency amount or a reference number against the original image before you act on it.",
    ].join("\n")
  }

  return [
    ...summary,
    ...found.slice(0, limit).map((f) => [
      `line ${f.line}: ${f.text.slice(0, 110)}`,
      ...f.why.map((w) => `  - ${w}`),
    ].join("\n")),
    found.length > limit ? `... (${found.length - limit} further flagged lines not shown)` : "",
    "",
    "A flag is a prompt to look again, not an error: product codes, currency amounts and mixed identifiers trip these patterns legitimately.",
  ].filter(Boolean).join("\n")
}
