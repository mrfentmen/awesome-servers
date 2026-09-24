const BASE = 'https://api.lever.co/v0/postings';
const UA = 'mrfentmen-lever-mcp/1.0';

export interface PostingsArgs {
  company: string;
  limit?: number;
}

export async function postings(args: PostingsArgs): Promise<string> {
  const company = (args.company ?? '').trim();
  if (!company) return 'Provide a company slug.';
  const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 30);
  const res = await fetch(`${BASE}/${encodeURIComponent(company)}?mode=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Lever returned ${res.status}`);
  const d = (await res.json()) as Array<{ id?: string; text?: string; hostedUrl?: string; workplaceType?: string; categories?: { commitment?: string; location?: string; team?: string } }>;
  if (!Array.isArray(d) || !d.length) return `No postings for "${company}".`;
  return `Lever postings for "${company}" (${d.length}):\n` +
    d.slice(0, limit).map((p, i) => {
      const cat = p.categories ?? {};
      return `${i + 1}. ${p.text ?? '?'} [${cat.commitment ?? ''}] ${cat.location ?? ''}`.trim();
    }).join('\n');
}
