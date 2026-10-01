const UA = 'mrfentmen-bored-mcp/1.0';
const BASE = 'https://bored-api.appbrewery.com';

interface Activity {
  activity?: string;
  type?: string;
  participants?: number;
  price?: number;
  accessibility?: number;
}

export interface TypeArg {
  type: string;
}
export interface ParticipantsArg {
  participants: number;
}

function fmt(a: Activity): string {
  return `Activity: ${a.activity ?? '?'}\nType: ${a.type ?? '?'} | Participants: ${a.participants ?? '?'} | Price: ${a.price ?? '?'} | Accessibility: ${a.accessibility ?? '?'}`;
}

export async function randomActivity(_args?: Record<string, never>): Promise<string> {
  const res = await fetch(`${BASE}/random`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Bored returned ${res.status}`);
  const d = (await res.json()) as Activity;
  if (!d.activity) return 'No activity returned.';
  return fmt(d);
}

export async function activityByType(args: TypeArg): Promise<string> {
  const res = await fetch(`${BASE}/filter?type=${encodeURIComponent(args.type)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Bored returned ${res.status}`);
  const d = (await res.json()) as Activity[] | Activity;
  const list = Array.isArray(d) ? d : [d];
  if (!list.length || !list[0]?.activity) return `No activities of type "${args.type}".`;
  return `Activities of type "${args.type}" (${list.length}):\n` + list.slice(0, 5).map((a, i) => `${i + 1}. ${a.activity}`).join('\n');
}

export async function activityByParticipants(args: ParticipantsArg): Promise<string> {
  const n = Math.min(Math.max(Number(args.participants) || 1, 1), 8);
  const res = await fetch(`${BASE}/filter?participants=${n}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Bored returned ${res.status}`);
  const d = (await res.json()) as Activity[] | Activity;
  const list = Array.isArray(d) ? d : [d];
  if (!list.length || !list[0]?.activity) return `No activities for ${n} participants.`;
  return `Activities for ${n} participants (${list.length}):\n` + list.slice(0, 5).map((a, i) => `${i + 1}. ${a.activity} (${a.type ?? '?'})`).join('\n');
}

// ---- muxA tools:

interface BoredActivity {
  activity?: string;
  type?: string;
  participants?: number;
  price?: number;
  availability?: number;
  accessibility?: string;
  duration?: string;
  kidFriendly?: boolean;
  link?: string;
  key?: string;
}

export interface CatalogueArgs {
  type?: string;
  kid_friendly_only?: boolean;
  free_only?: boolean;
}

export interface SearchArgs {
  keyword?: string;
  type?: string;
  participants?: number;
  max_price?: number;
  accessibility?: string;
  kid_friendly?: boolean;
  limit?: number;
}

