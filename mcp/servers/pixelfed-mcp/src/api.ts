const UA = 'mrfentmen-pixelfed-mcp/1.0';

export interface InstanceArgs {
  instance?: string;
}
export interface TimelineArgs {
  instance?: string;
  limit?: number;
}

export async function instance(args: InstanceArgs): Promise<string> {
  const host = String(args?.instance ?? 'pixelfed.social').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const res = await fetch(`https://${host}/api/v1/instance`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Pixelfed ${host} returned ${res.status}`);
  const d = (await res.json()) as { uri?: string; title?: string; short_description?: string; version?: string; stats?: { user_count?: number; status_count?: number; domain_count?: number } };
  if (!d.uri) throw new Error(`No instance data for ${host}.`);
  return `Pixelfed instance ${d.uri}\n${d.title ?? '?'}\n${(d.short_description ?? '').slice(0, 300)}\nVersion: ${d.version ?? '?'}\nUsers: ${d.stats?.user_count ?? '?'} | Posts: ${d.stats?.status_count ?? '?'} | Servers: ${d.stats?.domain_count ?? '?'}`;
}

export async function publicTimeline(args: TimelineArgs): Promise<string> {
  const host = String(args?.instance ?? 'pixelfed.social').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 15);
  const res = await fetch(`https://${host}/api/v1/timelines/public?limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Pixelfed ${host} returned ${res.status}`);
  const d = (await res.json()) as Array<{ id?: string; content?: string; created_at?: string; account?: { username?: string; display_name?: string }; media_attachments?: Array<{ url?: string; type?: string }> }>;
  if (!Array.isArray(d) || !d.length) return `No public posts on ${host}.`;
  return `Public timeline on ${host} (${d.length}):\n` + d.slice(0, limit).map((p, i) => {
    const strip = (p.content ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return `${i + 1}. @${p.account?.username ?? '?'}: ${strip.slice(0, 120)} (${(p.media_attachments ?? []).length} media)`;
  }).join('\n');
}

// ---- muxB tools:

type TrendTag = {
  name?: string;
  url?: string;
  history?: { day?: string; accounts?: string; uses?: string }[];
};

type ServerRule = { id?: string; text?: string; hint?: string };

type WeekStat = { week?: string; statuses?: string; logins?: string; registrations?: string };

