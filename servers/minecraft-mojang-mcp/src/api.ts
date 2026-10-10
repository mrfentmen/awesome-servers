const PROFILE = 'https://api.mojang.com/users/profiles/minecraft';
const SERVER = 'https://api.mcsrvstat.us/2';

export interface ProfileArgs {
  username: string;
}

export interface ServerStatusArgs {
  host: string;
}

export async function profile(args: ProfileArgs): Promise<string> {
  const username = (args.username ?? '').trim();
  if (!username) return 'Provide a Minecraft username.';
  const res = await fetch(`${PROFILE}/${encodeURIComponent(username)}`, {
    headers: { 'User-Agent': 'mrfentmen-minecraft-mojang-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Mojang returned ${res.status}`);
  const d = (await res.json()) as { name?: string; id?: string; errorMessage?: string };
  if (d.errorMessage) return `Mojang: ${d.errorMessage}`;
  return `Minecraft player:\nName: ${d.name ?? ''}\nUUID: ${d.id ?? ''}`;
}

export async function status(args: ServerStatusArgs): Promise<string> {
  const host = (args.host ?? '').trim();
  if (!host) return 'Provide a server host.';
  const res = await fetch(`${SERVER}/${encodeURIComponent(host)}`, {
    headers: { 'User-Agent': 'mrfentmen-minecraft-mojang-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`mcsrvstat returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const players = (d.players && typeof d.players === 'object' ? d.players as Record<string, unknown> : {});
  return [
    `Server ${host}:`,
    d.online === true ? `Online: yes` : `Online: no`,
    s('version') ? `Version: ${s('version')}` : '',
    players.online != null ? `Players: ${players.online}/${players.max}` : '',
    s('motd') && d.motd ? `\n${String(d.motd).replace(/§[0-9a-fk-or]/g, '').slice(0, 100)}` : '',
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

export interface LatestVersionArgs {
  limit?: number;
}

export interface WikiSearchArgs {
  query: string;
  limit?: number;
}

