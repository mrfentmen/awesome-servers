const UA = 'mrfentmen-hipsum-mcp/1.0';

export interface GenerateArgs {
  sentences?: number;
}

export async function generate(args: GenerateArgs): Promise<string> {
  const sentences = Math.min(Math.max(Number(args?.sentences ?? 3) || 3, 1), 10);
  const res = await fetch(`https://hipsum.co/api/?type=hipster-latin&sentences=${sentences}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Hipsum returned ${res.status}`);
  const d = (await res.json()) as string[];
  if (!Array.isArray(d) || !d.length) return 'No hipster text returned.';
  return `Hipster ipsum (${sentences} sentences):\n${d.join(' ')}`;
}

// ---- muxF tools:
const HIPSUM = "https://hipsum.co/api/"

const TYPES: Record<string, string> = {
  'hipster-latin': 'hipster speak mixed with Latin words from Lorem ipsum',
  'hipster-centric': 'hipster speak only',
}

function or(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'not reported'
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function pickType(value: unknown): string {
  const type = String(value ?? 'hipster-latin').trim().toLowerCase()
  if (!(type in TYPES)) {
    throw new Error(`Unknown type "${value}". Hipsum documents ${Object.keys(TYPES).map((k) => `${k} (${TYPES[k]})`).join(' and ')}.`)
  }
  return type
}

async function hipsum(params: Record<string, string>): Promise<string[]> {
  const qs = new URLSearchParams(params)
  const res = await fetch(`${HIPSUM}?${qs}`, {
    headers: { 'User-Agent': 'mrfentmen-hipsum-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Hipsum returned ${res.status}`)
  const d = (await res.json()) as unknown
  if (!Array.isArray(d) || !d.length) throw new Error('Hipsum returned an empty array for those parameters.')
  return d.map((x) => String(x))
}

/** A Hipsum body cut to an exact word budget per paragraph, for when the copy has to fit a layout. */
export async function placeholderBlock(args: { wordsPerParagraph?: number; paragraphs?: number; type?: string; startWithLorem?: boolean }): Promise<string> {
  const perParagraph = bound(args.wordsPerParagraph, 5, 300, 40)
  const paragraphs = bound(args.paragraphs, 1, 10, 4)
  const type = pickType(args.type)
  const wanted = perParagraph * paragraphs
  const params: Record<string, string> = { type, paras: String(Math.min(20, paragraphs + 2)) }
  if (args.startWithLorem) params['start-with-lorem'] = '1'
  const body = await hipsum(params)
  const pool = body.join(' ').split(/\s+/).filter(Boolean)
  if (pool.length < wanted) {
    throw new Error(`Hipsum returned ${pool.length} words but ${wanted} were asked for. Ask for fewer words or more paragraphs.`)
  }
  const out: string[] = []
  let cursor = 0
  for (let i = 0; i < paragraphs; i += 1) {
    const slice = pool.slice(cursor, cursor + perParagraph)
    cursor += perParagraph
    out.push(`${i + 1}. ${slice.join(' ').replace(/\s+([,.])/g, '$1')}.`)
  }
  return [
    `Placeholder block: ${paragraphs} paragraph(s) of exactly ${perParagraph} words, drawn from ${type} Hipsum`,
    `Pool the service returned: ${pool.length} words, ${out.length * perParagraph} used, ${pool.length - out.length * perParagraph} left over`,
    `Sentences end wherever the cut lands, so the last word of a paragraph is not necessarily a full stop in the source.`,
    '',
    ...out,
  ].join('\n')
}
