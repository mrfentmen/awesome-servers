const BASE = 'https://history.muffinlabs.com';
const UA = 'mrfentmen-muffinlabs-mcp/1.0';
export async function day(args) {
    const now = new Date();
    const month = Number(args?.month ?? now.getMonth() + 1);
    const dayNum = Number(args?.day ?? now.getDate());
    if (month < 1 || month > 12 || dayNum < 1 || dayNum > 31)
        return 'Provide valid month and day.';
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
    const res = await fetch(`${BASE}/date/${month}/${dayNum}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`MuffinLabs returned ${res.status}`);
    const d = (await res.json());
    const data = d.data ?? {};
    const events = data.Events ?? [];
    const births = data.Births ?? [];
    const deaths = data.Deaths ?? [];
    const rows = events.slice(0, limit).map((e, i) => `${i + 1}. (${e.year ?? '?'}) ${e.text ?? '?'}`.slice(0, 160));
    return [
        `On this day (${d.date ?? `${month}/${dayNum}`}):`,
        `Events (${events.length}):\n${rows.join('\n') || '  none'}`,
        `Notable births: ${births.slice(0, 3).map((b) => `${b.year ?? '?'}: ${b.text ?? '?'}`.slice(0, 80)).join(' | ') || 'none'}`,
        `Notable deaths: ${deaths.slice(0, 3).map((b) => `${b.year ?? '?'}: ${b.text ?? '?'}`.slice(0, 80)).join(' | ') || 'none'}`,
    ].join('\n');
}
