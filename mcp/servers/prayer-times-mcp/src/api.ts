const BASE = 'https://api.aladhan.com/v1';

export interface TimingsArgs {
  city: string;
  country: string;
}

export async function timings(args: TimingsArgs): Promise<string> {
  const url = `${BASE}/timingsByCity?city=${encodeURIComponent(args.city)}&country=${encodeURIComponent(args.country)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-prayer-times-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`aladhan returned ${res.status}`);
  const json = (await res.json()) as {
    data?: { timings?: Record<string, string>; date?: { gregorian?: { date?: string } } };
  };
  const d = json.data;
  if (!d?.timings) throw new Error('aladhan returned no timings');
  const t = d.timings;
  const lines = [`Prayer times for ${args.city}, ${args.country} (${d.date?.gregorian?.date ?? ''}):`];
  for (const [label, key] of [
    ['Fajr', 'Fajr'],
    ['Sunrise', 'Sunrise'],
    ['Dhuhr', 'Dhuhr'],
    ['Asr', 'Asr'],
    ['Maghrib', 'Maghrib'],
    ['Isha', 'Isha'],
  ] as const) {
    if (t[key]) lines.push(`${label}: ${t[key]}`);
  }
  return lines.join('\n');
}

// ---- muxB tools:

const AT_BASE = 'https://api.aladhan.com/v1';

const AT_TIMING_KEYS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

async function atGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${AT_BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-prayer-times-mcp/1.0', Accept: 'application/json' },
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`aladhan returned ${res.status}`);
  return (await res.json()) as T;
}

export interface MonthCalendarArgs {
  city: string;
  country: string;
  month: number;
  year: number;
}

export interface HijriDateArgs {
  date: string;
  direction: 'to_hijri' | 'to_gregorian';
}

