const BASE = 'https://data.vatsim.net/v3/vatsim-data.json';

export interface ListArgs {
  limit?: number;
}

async function load(): Promise<Record<string, unknown>> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-vatsim-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`VATSIM returned ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function pilots(args: ListArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const d = await load();
  const rows = (d.pilots ?? []) as Array<Record<string, unknown>>;
  if (!rows.length) return 'No pilots connected.';
  return `Connected pilots (${rows.length} total, ${Math.min(rows.length, limit)} shown):\n` +
    rows.slice(0, limit).map((p, i) => {
      const s = (k: string) => (p[k] != null ? String(p[k]) : '');
      return `${i + 1}. ${s('callsign')} | ${s('flight_plan') ? `${s('departure')}->${s('arrival')} ${s('planned_aircraft')}` : 'no flight plan'} | ${s('groundspeed')} kt`;
    }).join('\n');
}

export async function controllers(args: ListArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const d = await load();
  const rows = (d.controllers ?? []) as Array<Record<string, unknown>>;
  if (!rows.length) return 'No controllers connected.';
  return `Connected ATC (${rows.length} total, ${Math.min(rows.length, limit)} shown):\n` +
    rows.slice(0, limit).map((c, i) => {
      const s = (k: string) => (c[k] != null ? String(c[k]) : '');
      return `${i + 1}. ${s('callsign')} | ${s('frequency')} | ${s('name')}`;
    }).join('\n');
}

// ---- muxB tools:

const vsField = (row: Record<string, unknown>, key: string): string =>
  row[key] != null && String(row[key]).trim() ? String(row[key]) : 'not reported'

export interface AtisArgs {
  limit?: number;
  frequency?: string;
}

export interface ServersArgs {}

export async function serverList(_args: ServersArgs): Promise<string> {
  const d = await load();
  const general = (d.general ?? {}) as Record<string, unknown>;
  const rows = (d.servers ?? []) as Array<Record<string, unknown>>;
  const head = [
    `VATSIM network: ${vsField(general, 'connected_clients')} connected clients, ${vsField(general, 'unique_users')} unique users`,
    `Data version ${vsField(general, 'version')}, updated ${vsField(general, 'update_timestamp')}`,
  ];
  if (!rows.length) return [...head, 'No servers reported.'].join('\n');
  return [
    ...head,
    `Servers (${rows.length} shown):`,
    ...rows.map((s, i) => {
      const allow = s.client_connections_allowed === true ? 'accepts clients' : s.client_connections_allowed === false ? 'client connections refused' : 'client status not reported';
      return `${i + 1}. ${vsField(s, 'ident')} | ${vsField(s, 'location')} | ${vsField(s, 'hostname_or_ip')} | ${allow}`;
    }),
  ].join('\n');
}

export interface PilotDetailArgs {
  callsign?: string;
  cid?: number;
}

