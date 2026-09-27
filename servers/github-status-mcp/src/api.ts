const BASE = 'https://www.githubstatus.com/api/v2';
const UA = 'mrfentmen-github-status-mcp/1.0';

export async function status(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/status.json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GitHub Status returned ${res.status}`);
  const d = (await res.json()) as {
    page?: { name?: string; updated_at?: string };
    status?: { indicator?: string; description?: string };
    components?: Array<{ name?: string; status?: string }>;
  };
  const components = d.components ?? [];
  return [
    `GitHub Status (${d.page?.name ?? '?'}):`,
    `Overall: ${d.status?.indicator ?? '?'} - ${d.status?.description ?? '?'}`,
    `Updated: ${d.page?.updated_at ?? '?'}`,
    components.length ? `Components:\n${components.slice(0, 20).map((c, i) => `  ${i + 1}. ${c.name ?? '?'}: ${c.status ?? '?'}`).join('\n')}` : null,
  ].filter(Boolean).join('\n');
}

export interface IncidentsArgs {
  limit?: number;
}

export async function incidents(args: IncidentsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 10);
  const res = await fetch(`${BASE}/incidents/unresolved.json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GitHub Status returned ${res.status}`);
  const d = (await res.json()) as { incidents?: Array<{ name?: string; status?: string; impact?: string; created_at?: string; updated_at?: string }> };
  const incidents = d.incidents ?? [];
  if (!incidents.length) return 'No unresolved GitHub incidents.';
  return `GitHub unresolved incidents (${incidents.length}):\n` +
    incidents.slice(0, limit).map((i, n) => `${n + 1}. ${i.name ?? '?'} [${i.status ?? '?'}] impact ${i.impact ?? '?'}`).join('\n');
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`GitHub Status returned ${res.status}`);
  return res.json();
}

export async function components(): Promise<string> {
  const d = await getJson(`${BASE}/components.json`);
  const rows = (d?.components ?? []) as Array<{ name?: string; status?: string }>;
  if (!rows.length) return 'No components returned.';
  return rows.map((c, i) => `${i + 1}. ${c.name ?? '?'}: ${c.status ?? '?'}`).join('\n');
}

export async function maintenances(args: IncidentsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 10);
  const d = await getJson(`${BASE}/scheduled-maintenances.json`);
  const rows = (d?.scheduled_maintenances ?? []) as Array<{ name?: string; status?: string; impact?: string; scheduled_for?: string }>;
  if (!rows.length) return 'No scheduled maintenance.';
  return rows.slice(0, limit).map((m, i) => `${i + 1}. ${m.name ?? '?'} [${m.status ?? '?'}] ${m.scheduled_for ?? ''}`).join('\n');
}

export async function incidentDetails(args: { id?: string }): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) throw new Error('Provide an incident id.');
  const d = await getJson(`${BASE}/incidents/${encodeURIComponent(id)}.json`);
  const inc = (d as any)?.incident ?? {};
  const updates = (inc.incident_updates ?? []) as Array<{ body?: string; created_at?: string }>;
  return `${inc.name ?? id} [${inc.status ?? '?'}]\n` + updates.slice(0, 5).map((u) => `- ${String(u.created_at ?? '').slice(0, 16)}: ${(u.body ?? '').slice(0, 200)}`).join('\n');
}
