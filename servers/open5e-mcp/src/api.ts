const BASE = 'https://api.open5e.com/v1';

export interface MonstersArgs {
  search?: string;
  limit?: number;
}

export interface SpellsArgs {
  search?: string;
  limit?: number;
}

async function query(path: string): Promise<{ results?: unknown[] }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'mrfentmen-open5e-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Open5e returned ${res.status}`);
  return (await res.json()) as { results?: unknown[] };
}

export async function monsters(args: MonstersArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const search = (args.search ?? '').trim();
  const data = await query(`/monsters/?limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
  const rows = (data.results ?? []).map((m) => {
    const o = m as Record<string, unknown>;
    return `${o.name ?? 'unnamed'} | CR ${o.cr ?? 'n/a'} | type ${o.type ?? ''} | ${String(o.size ?? '').toLowerCase()} | hp ${o.hit_points ?? ''}`;
  });
  if (!rows.length) return `No monsters found${search ? ` for "${search}"` : ''}.`;
  return `Monsters (${rows.length} shown):\n` + rows.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

export async function spells(args: SpellsArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const search = (args.search ?? '').trim();
  const data = await query(`/spells/?limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
  const rows = (data.results ?? []).map((s) => {
    const o = s as Record<string, unknown>;
    return `${o.name ?? 'unnamed'} | level ${o.level ?? 'n/a'} | school ${o.school ?? ''}`;
  });
  if (!rows.length) return `No spells found${search ? ` for "${search}"` : ''}.`;
  return `Spells (${rows.length} shown):\n` + rows.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

// ---- muxB tools:
type O5eMonster = {
  name?: string;
  size?: string;
  type?: string;
  subtype?: string;
  alignment?: string;
  armor_class?: number;
  armor_desc?: string;
  hit_points?: number;
  hit_dice?: string;
  speed?: Record<string, number | string>;
  strength?: number; dexterity?: number; constitution?: number;
  intelligence?: number; wisdom?: number; charisma?: number;
  cr?: string; challenge_rating?: string;
  languages?: string;
  traits?: string;
  actions?: { name?: string; desc?: string }[];
  bonus_actions?: { name?: string; desc?: string }[];
  reactions?: { name?: string; desc?: string }[];
  environments?: string[];
  source?: string;
  document__title?: string;
}

type O5eSpell = {
  name?: string;
  level?: string;
  level_int?: number;
  school?: string;
  casting_time?: string;
  range?: string;
  components?: string;
  material?: string;
  ritual?: boolean;
  duration?: string;
  desc?: string;
  higher_level?: string;
  dnd_class?: string;
  source?: string;
  document__title?: string;
}

type O5eClass = {
  name?: string;
  hit_dice?: number | string;
  hp_at_1st_level?: string;
  hp_at_higher_levels?: string;
  prof_armor?: string;
  prof_saving_throws?: string;
  prof_skills?: string;
  primary_ability?: string;
  archetypes?: { name?: string; desc?: string }[];
  source?: string;
  document__title?: string;
}

const plain = (v: string | undefined, max: number): string => {
  const t = (v ?? '').replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/\s+/g, ' ').trim();
  if (!t) return 'not reported';
  return t.length > max ? `${t.slice(0, max)}...` : t;
}

