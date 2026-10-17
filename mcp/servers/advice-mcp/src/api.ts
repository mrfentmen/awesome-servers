const BASE = 'https://api.adviceslip.com/advice';

export async function random(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-advice-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Advice Slip returned ${res.status}`);
  const data = (await res.json()) as { slip?: { id?: number; advice?: string } };
  if (!data.slip?.advice) throw new Error('Advice Slip returned an empty response');
  return data.slip.advice;
}

// ---- muxA tools:

async function slip(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-advice-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 404) throw new Error(`Advice Slip has nothing at ${path}`);
  if (!res.ok) throw new Error(`Advice Slip returned ${res.status} for ${path}`);
  return (await res.json()) as Record<string, unknown>;
}

export interface SearchArgs {
  topic: string;
}

export interface IdArgs {
  slip_id: number;
}



export async function adviceSearch(args: { topic: string }): Promise<string> {
  const topic = (args.topic ?? '').trim();
  if (!topic) return 'Provide a topic to search for.';
  const res = await fetch('https://api.adviceslip.com/advice/search/' + encodeURIComponent(topic), {
    headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('Advice Slip returned ' + res.status);
  const data = (await res.json()) as { total_results?: string; query?: string; slips?: Array<{ id: number; advice: string }> };
  const slips = data.slips ?? [];
  if (!slips.length) return 'No advice found for "' + topic + '".';
  const lines = ['Advice Slip search for "' + topic + '", ' + (data.total_results ?? slips.length) + ' result(s):', ''];
  for (const s of slips) {
    lines.push('• [' + s.id + '] ' + s.advice);
  }
  return lines.join('\n');
}

export async function adviceById(args: { slip_id: number }): Promise<string> {
  const id = Number(args.slip_id);
  if (!Number.isFinite(id)) return 'Provide a valid slip ID.';
  const res = await fetch('https://api.adviceslip.com/advice/' + id, {
    headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error('Advice Slip returned ' + res.status);
  const data = (await res.json()) as { slip?: { id: number; advice: string }; message?: { type: string; text: string } };
  if (data.message) return 'Advice slip not found: ' + data.message.text;
  const slip = data.slip;
  if (!slip) return 'No advice slip found for ID ' + id + '.';
  return 'Advice slip #' + slip.id + ': ' + slip.advice;
}
