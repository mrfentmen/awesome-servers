export class CrispError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CrispError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const id = process.env.CRISP_IDENTIFIER;
  const k = process.env.CRISP_KEY;
  if (!id || !k) throw new CrispError("Set CRISP_IDENTIFIER and CRISP_KEY (Crisp plugin settings).");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${id}:${k}`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.crisp.chat/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CrispError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CrispError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listVisitors(websiteId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/visitors/list`);
}

export function getProfile(websiteId: string, email: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/people/profile/${encodeURIComponent(email)}`);
}

export function getConversation(websiteId: string, sessionId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/conversations/${encodeURIComponent(sessionId)}`);
}



export function conversations(websiteId: string, page?: string): Promise<string> {
  const p = Number(page ?? 1) || 1;
  return get(`/website/${encodeURIComponent(websiteId)}/conversations/${p}`);
}

export function conversationMessages(websiteId: string, sessionId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/conversation/${encodeURIComponent(sessionId)}/messages`);
}

export function conversationMeta(websiteId: string, sessionId: string): Promise<string> {
  return get(`/website/${encodeURIComponent(websiteId)}/conversation/${encodeURIComponent(sessionId)}/meta`);
}

// ---- muxD tools:

const CRISP_AUTH_NOTE = 'Crisp checks routing before authentication, so a 404 from this API means the path does not exist rather than that the key is wrong.';

/** Crisp wraps every v1 response in { error, reason, data }. */
function crispEnvelope(raw: string): { data: any; reason: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new CrispError(`Crisp returned a body that is not JSON: ${raw.slice(0, 200)}`);
  }
  if (parsed?.error === true) {
    const why = typeof parsed?.data === 'string' ? parsed.data : JSON.stringify(parsed?.data ?? '').slice(0, 160);
    throw new CrispError(`Crisp reported an error (${parsed?.reason ?? 'unknown'}): ${why}. ${CRISP_AUTH_NOTE}`);
  }
  return { data: parsed?.data, reason: String(parsed?.reason ?? '') };
}

const crispText = (v: unknown, max = 80): string => {
  if (v === null || v === undefined || v === '') return '';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > max ? `${s.slice(0, max)}…` : s;
};

export interface OperatorsArgs {
  website_id: string;
}

/**
 * The agent roster with who is online, who owns the workspace, and who has
 * two-factor enabled. An operator without 2FA is a single stolen password away
 * from reading every conversation on the account.
 */
export async function listOperators(args: OperatorsArgs): Promise<string> {
  const websiteId = String(args.website_id ?? '').trim();
  if (!websiteId) throw new CrispError('Provide website_id (the Crisp plugin settings identifier).');
  const { data } = crispEnvelope(await get(`/website/${encodeURIComponent(websiteId)}/operators/list`));
  const rows: any[] = Array.isArray(data) ? data : [];
  if (!rows.length) return `Crisp returned no operators for website ${websiteId}.`;

  type Op = { type: string; userId: string; email: string; name: string; role: string; title: string; availability: string; twoFactor: boolean; identifier: string };
  const ops: Op[] = rows.map((r) => {
    const d = (r?.details ?? {}) as Record<string, unknown>;
    return {
      type: crispText(r?.type, 20),
      userId: crispText(d.user_id ?? '', 40),
      email: crispText(d.email ?? '', 60),
      name: [d.first_name, d.last_name].map((x) => crispText(x, 30)).filter(Boolean).join(' '),
      role: crispText(d.role ?? '', 20),
      title: crispText(d.title ?? '', 40),
      availability: crispText(d.availability ?? '', 20),
      twoFactor: d.has_token === true,
      identifier: crispText(d.identifier ?? '', 40),
    };
  });

  const owners = ops.filter((o) => o.role === 'owner');
  const pending = ops.filter((o) => o.type === 'invite');
  const online = ops.filter((o) => o.availability === 'online');
  const away = ops.filter((o) => o.availability === 'away');
  const no2fa = ops.filter((o) => o.type === 'operator' && !o.twoFactor);
  const unknownAvailability = ops.filter((o) => o.type === 'operator' && !o.availability);

  const width = Math.max(...ops.map((o) => (o.name || o.email || o.userId || '?').length), 8);
  const lines = [
    `Crisp operators on website ${websiteId}: ${ops.length} (${owners.length} owner, ${ops.filter((o) => o.type === 'operator').length} operator, ${pending.length} pending invite${pending.length === 1 ? '' : 's'}, ${ops.filter((o) => o.type === 'sandbox').length} sandbox)`,
    `Availability now: ${online.length} online, ${away.length} away, ${ops.filter((o) => o.availability === 'offline').length} offline`,
    '',
    `${"member".padEnd(width)}  ${"role".padEnd(8)}${"status".padEnd(9)}${"2FA".padEnd(6)} email`,
  ];
  for (const o of ops) {
    const who = o.name || o.email || o.userId || '?';
    const status = o.type === 'invite' ? 'invited' : o.type === 'sandbox' ? 'sandbox' : o.availability || 'unknown';
    const twoFa = o.type === 'operator' ? (o.twoFactor ? 'on' : 'OFF') : '-';
    lines.push(`${who.slice(0, width).padEnd(width)}  ${(o.role || '-').padEnd(8)}${status.padEnd(9)}${twoFa.padEnd(6)} ${o.email}${o.title ? ` | ${o.title}` : ''}`);
  }

  const notes: string[] = [];
  if (no2fa.length) {
    notes.push(`Two-factor is not enabled for ${no2fa.length} operator(s): ${no2fa.map((o) => o.name || o.email).join(', ')}. Anyone who gets one of these passwords can read every conversation on the account.`);
  }
  if (!owners.length) {
    notes.push('No owner is listed, so nobody holds the role that can change billing, delete the workspace or manage operators.');
  } else if (owners.length > 1) {
    notes.push(`${owners.length} owners are listed. Confirm that is deliberate before treating owner access as restricted.`);
  }
  if (pending.length) {
    notes.push(`${pending.length} invite(s) have not been accepted yet: ${pending.map((o) => o.email).join(', ')}. An unaccepted invite is still a usable credential for whoever holds the link.`);
  }
  if (unknownAvailability.length) {
    notes.push(`${unknownAvailability.length} operator(s) report no availability, which usually means they have never connected the Crisp desktop or mobile app.`);
  }
  if (notes.length) lines.push('', ...notes);
  return lines.join('\n');
}

export interface InboxesArgs {
  website_id: string;
  page?: number;
}

/** The inbox topology, which is how a conversation reaches the right person in a Crisp workspace with several queues. */
export async function listInboxes(args: InboxesArgs): Promise<string> {
  const websiteId = String(args.website_id ?? '').trim();
  if (!websiteId) throw new CrispError('Provide website_id (the Crisp plugin settings identifier).');
  const page = Math.max(Math.floor(Number(args.page ?? 1)) || 1, 1);
  const { data } = crispEnvelope(await get(`/website/${encodeURIComponent(websiteId)}/inboxes/list/${page}`));
  const rows: any[] = Array.isArray(data) ? data : [];
  if (!rows.length) return `Crisp returned no inboxes on page ${page} for website ${websiteId}. A workspace with no inbox has nowhere to route a conversation.`;

  type Box = { id: string; name: string; emoji: string; order: number; operators: string[]; teams: string[]; expanded: string[] };
  const boxes: Box[] = rows.map((b) => ({
    id: crispText(b?.inbox_id ?? '', 40),
    name: crispText(b?.name ?? '', 60),
    emoji: crispText(b?.emoji ?? '', 8),
    order: Number(b?.order ?? NaN),
    operators: Array.isArray(b?.operators) ? (b.operators as string[]).map((o) => crispText(o, 40)) : [],
    teams: Array.isArray(b?.teams) ? (b.teams as string[]).map((o) => crispText(o, 40)) : [],
    expanded: Array.isArray(b?.team_operators) ? (b.team_operators as string[]).map((o) => crispText(o, 40)) : [],
  })).sort((a, b) => (Number.isFinite(a.order) ? a.order : 999) - (Number.isFinite(b.order) ? b.order : 999));

  // Width is measured over the label as printed, emoji included, so the id column
  // always starts with at least one space of separation.
  const labelOf = (b: Box): string => (b.emoji ? `${b.emoji} ${b.name}` : b.name) || '(unnamed)';
  const width = Math.max(...boxes.map((b) => labelOf(b).length), 6);
  const unstaffed = boxes.filter((b) => b.operators.length === 0 && b.expanded.length === 0);
  const totalOps = new Set(boxes.flatMap((b) => [...b.operators, ...b.expanded])).size;

  const lines = [
    `Crisp inboxes on website ${websiteId}, page ${page}: ${boxes.length} inbox(es) covering ${totalOps} distinct operator(s)`,
    '',
    `${"#".padStart(3)} ${"inbox".padEnd(width)}${"id".padEnd(40)}${"ops".padStart(5)}${"teams".padStart(7)}  emoji`,
  ];
  boxes.forEach((b, i) => {
    const label = labelOf(b);
    lines.push(
      `${String(Number.isFinite(b.order) ? b.order : i).padStart(3)} ${label.slice(0, width).padEnd(width)} ${b.id.padEnd(40)}` +
      `${String(b.operators.length + b.expanded.length).padStart(5)}${String(b.teams.length).padStart(7)}`,
    );
    if (b.teams.length) {
      lines.push(`      teams: ${b.teams.join(', ')}${b.expanded.length ? ` (expands to ${b.expanded.length} operator(s): ${b.expanded.join(', ')})` : ''}`);
    } else if (b.expanded.length) {
      lines.push(`      operators: ${b.expanded.join(', ')}`);
    }
  });

  const notes: string[] = [];
  if (unstaffed.length) {
    notes.push(`No operator is attached to ${unstaffed.length} inbox(es): ${unstaffed.map((b) => b.name).join(', ')}. A conversation routed there has nobody to answer it until a member is added.`);
  }
  if (boxes.length > 1 && boxes.some((b) => b.order === 0)) {
    notes.push('Inbox 0 is the default destination, so anything not matched by a routing rule lands there. Check who is on it.');
  }
  if (notes.length) lines.push('', ...notes);
  return lines.join('\n');
}

export interface AudienceArgs {
  website_id: string;
}

/** How big the contact list is and how many visitors are on the site right now, from two cheap aggregate calls. */
export async function audiencePulse(args: AudienceArgs): Promise<string> {
  const websiteId = String(args.website_id ?? '').trim();
  if (!websiteId) throw new CrispError('Provide website_id (the Crisp plugin settings identifier).');

  const [visitorRaw, peopleRaw] = await Promise.all([
    get(`/website/${encodeURIComponent(websiteId)}/visitors/count`),
    get(`/website/${encodeURIComponent(websiteId)}/people/stats`),
  ]);
  const visitors = crispEnvelope(visitorRaw).data as Record<string, unknown> | undefined;
  const people = crispEnvelope(peopleRaw).data as Record<string, unknown> | undefined;

  const count = Number(visitors?.count ?? NaN);
  const active = Number(visitors?.active ?? NaN);
  const limited = visitors?.limited === true;
  const total = Number(people?.total ?? NaN);

  const lines = [
    `Crisp audience for website ${websiteId}:`,
    `  contacts on the people list: ${Number.isFinite(total) ? total.toLocaleString() : 'n/a'}`,
    `  visitors on the site right now: ${Number.isFinite(count) ? count.toLocaleString() : 'n/a'}`,
    `  of those actively browsing: ${Number.isFinite(active) ? active.toLocaleString() : 'n/a'}`,
  ];
  if (limited) {
    lines.push('  visitor sockets are LIMITED: Crisp is capping how many concurrent visitor connections it accepts, so the counts above understate real traffic and chat widgets may refuse to connect.');
  }
  if (Number.isFinite(count) && Number.isFinite(total) && total > 0) {
    lines.push(`  visitors are ${(count / total * 100).toFixed(2)}% of the size of the contact list, which is a rough read on list growth rather than a conversion rate.`);
  }
  if (Number.isFinite(count) && count === 0) {
    lines.push('  Nobody is on the site at this moment. A zero here with a non-zero contact list means the widget may be failing to connect, not that traffic stopped.');
  }
  return lines.join('\n');
}
