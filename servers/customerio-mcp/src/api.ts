export class CustomerioError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CustomerioError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const id = process.env.CUSTOMERIO_SITE_ID;
  const k = process.env.CUSTOMERIO_API_KEY;
  if (!id || !k) throw new CustomerioError("Set CUSTOMERIO_SITE_ID and CUSTOMERIO_API_KEY.");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${id}:${k}`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.customer.io/v1" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new CustomerioError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new CustomerioError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listCustomers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/customers?limit=${n}`);
}

export function getCustomer(identifier: string): Promise<string> {
  return get(`/customers/${encodeURIComponent(identifier)}`);
}

export function listSegments(): Promise<string> {
  return get("/segments");
}



export function segmentDetails(segmentId: string): Promise<string> {
  return get(`/segments/${encodeURIComponent(segmentId)}`);
}

export function campaigns(): Promise<string> {
  return get("/campaigns");
}

export function campaignDetails(campaignId: string): Promise<string> {
  return get(`/campaigns/${encodeURIComponent(campaignId)}`);
}

export function newsletters(): Promise<string> {
  return get("/newsletters");
}

export function activities(): Promise<string> {
  return get("/activities");
}

export function customerActivities(identifier: string): Promise<string> {
  return get(`/customers/${encodeURIComponent(identifier)}/activities`);
}

export function customerMessages(identifier: string): Promise<string> {
  return get(`/customers/${encodeURIComponent(identifier)}/messages`);
}

// ---- muxD tools:

interface MetricSeries {
  attempted?: number[]
  bounced?: number[]
  clicked?: number[]
  converted?: number[]
  deferred?: number[]
  delivered?: number[]
  failed?: number[]
  human_clicked?: number[]
  human_opened?: number[]
  link_untracked?: number[]
  machine_clicked?: number[]
  machine_opened?: number[]
  open_untracked?: number[]
  opened?: number[]
  replied?: number[]
  sent?: number[]
  spammed?: number[]
  suppressed?: number[]
  unsubscribed?: number[]
  untracked?: number[]
  undeliverable?: number[]
  topic_unsubscribed?: number[]
  tracking_consent_denied?: number[]
  [key: string]: number[] | undefined
}

const cioSum = (s: MetricSeries | undefined, key: string): number =>
  (s?.[key] ?? []).reduce((a, b) => a + (Number(b) || 0), 0);

/** Rates are only honest over the tracked denominator, which Customer.io publishes separately. */
function cioRates(s: MetricSeries | undefined): string[] {
  if (!s) return [];
  const sent = cioSum(s, 'sent');
  const delivered = cioSum(s, 'delivered');
  const opened = cioSum(s, 'opened');
  const humanOpened = cioSum(s, 'human_opened');
  const openUntracked = cioSum(s, 'open_untracked');
  const clicked = cioSum(s, 'clicked');
  const humanClicked = cioSum(s, 'human_clicked');
  const machineClicked = cioSum(s, 'machine_clicked');
  const linkUntracked = cioSum(s, 'link_untracked');
  const unsubscribed = cioSum(s, 'unsubscribed');

  // Customer.io documents open_untracked and link_untracked as subtracted from the
  // rate denominators, so the base is delivered minus untracked, not raw delivered.
  const openBase = Math.max(delivered - openUntracked, 0);
  const clickBase = Math.max(delivered - linkUntracked, 0);
  const pct = (n: number, d: number): string => (d > 0 ? `${((n / d) * 100).toFixed(2)}%` : 'n/a');

  const lines = [
    `sent ${sent.toLocaleString()} | delivered ${delivered.toLocaleString()} | bounced ${cioSum(s, 'bounced').toLocaleString()} | failed ${cioSum(s, 'failed').toLocaleString()} | deferred ${cioSum(s, 'deferred').toLocaleString()}`,
    `opens ${opened.toLocaleString()}${humanOpened ? `, of which human ${humanOpened.toLocaleString()}` : ''} | clicks ${clicked.toLocaleString()}${humanClicked ? `, of which human ${humanClicked.toLocaleString()}` : ''} | replies ${cioSum(s, 'replied').toLocaleString()}`,
  ];
  if (openUntracked) lines.push(`open rate ${pct(humanOpened || opened, openBase)} over ${openBase.toLocaleString()} tracked, after removing ${openUntracked.toLocaleString()} with open tracking inactive`);
  if (linkUntracked) lines.push(`click rate ${pct(humanClicked || clicked, clickBase)} over ${clickBase.toLocaleString()} tracked, after removing ${linkUntracked.toLocaleString()} with link tracking inactive`);
  if (machineClicked) lines.push(`machine clicks ${machineClicked.toLocaleString()}, which is ${pct(machineClicked, clicked)} of all clicks and is why the human-only figure is the one to read.`);
  const consentDenied = cioSum(s, 'tracking_consent_denied');
  if (consentDenied) lines.push(`${consentDenied.toLocaleString()} recipient(s) denied tracking consent, so they are counted in the untracked totals above.`);
  const untracked = cioSum(s, 'untracked');
  if (untracked) lines.push(`${untracked.toLocaleString()} delivered message(s) were entirely untracked.`);
  if (unsubscribed) lines.push(`unsubscribed ${unsubscribed.toLocaleString()} (${pct(unsubscribed, sent)} of sent)`);
  const spammed = cioSum(s, 'spammed');
  if (spammed) lines.push(`marked as spam ${spammed.toLocaleString()} (${pct(spammed, sent)} of sent)`);
  const suppressed = cioSum(s, 'suppressed');
  if (suppressed) lines.push(`suppressed ${suppressed.toLocaleString()}, meaning they were never sent to`);
  return lines;
}

/** Renders the same metric payload for both broadcast and automation metrics. */
function cioRenderMetrics(label: string, id: number, series: MetricSeries | undefined, period: string, steps: number, itemType: string): string {
  if (!series) return `${label} ${id} returned no metric series. It may not have finished sending, or no steps are available for ${period}.`;
  const keys = Object.keys(series).filter((k) => Array.isArray(series[k]) && series[k].length > 0);
  if (!keys.length) {
    return `${label} ${id} has no recorded metrics yet. Customer.io returns empty series until a message is actually sent, so this usually means the ${itemType} has not gone out.`;
  }
  const length = Math.max(...keys.map((k) => (series[k] as number[]).length));
  const head = [
    `${label} ${id} over the last ${steps} ${period}(s), ${length} data point(s) returned, oldest first:`,
    '',
    ...cioRates(series),
  ];
  const showSteps = Math.min(length, 14);
  const totals: Array<[string, number]> = keys
    .map((k) => [k, cioSum(series, k)] as [string, number])
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1]);
  const head2 = [
    '',
    `Cumulative totals: ${totals.map(([k, v]) => `${k} ${v.toLocaleString()}`).join(', ') || 'all zero'}`,
  ];
  if (length > 1) {
    const perStep: string[] = [];
    for (let i = length - showSteps; i < length; i += 1) {
      const cells = keys
        .map((k) => {
          const arr = series[k] as number[];
          const v = arr[i];
          return v === undefined ? null : `${k} ${v.toLocaleString()}`;
        })
        .filter((c): c is string => c !== null && !/^(drafted|created|tracking_consent_granted|tracking_consent_denied) /.test(c));
      if (cells.length) perStep.push(`  step ${i + 1}/${length} (${period}): ${cells.join(', ')}`);
    }
    head2.push('', `By step${length > showSteps ? `, last ${showSteps} of ${length}` : ''}:`, ...perStep);
  }
  return [...head, ...head2].join('\n');
}

const CIO_PERIODS = ['hours', 'days', 'weeks', 'months'] as const;
const CIO_MAX_STEPS: Record<string, number> = { hours: 24, days: 45, weeks: 12, months: 121 };

function cioPeriodArgs(period: string, steps: number | undefined): { period: string; steps: number; note: string } {
  const p = String(period ?? '').trim().toLowerCase();
  if (p && !CIO_PERIODS.includes(p as (typeof CIO_PERIODS)[number])) {
    throw new CustomerioError(`period must be one of ${CIO_PERIODS.join(', ')}.`);
  }
  const chosen = (p || 'days') as (typeof CIO_PERIODS)[number];
  const cap = CIO_MAX_STEPS[chosen];
  // Customer.io treats steps=1 as two periods, and never returns fewer than 2.
  const requested = Math.floor(Number(steps ?? 0) || 0);
  const n = Math.min(Math.max(requested, 2), cap);
  const note = requested > cap
    ? `Customer.io caps ${chosen} at ${cap} steps, so the request for ${requested} was reduced to ${cap}.`
    : requested === 1
      ? 'Customer.io treats steps=1 as two periods, so the minimum used here is 2.'
      : '';
  return { period: chosen, steps: n, note };
}

export interface BroadcastMetricsArgs {
  broadcast_id: string;
  period?: string;
  steps?: number;
  type?: string;
}

/** Delivery, open and click metrics for one broadcast, computed the way Customer.io documents, with human clicks separated from machine ones. */
export async function broadcastMetrics(args: BroadcastMetricsArgs): Promise<string> {
  const id = Number(args.broadcast_id);
  if (!Number.isFinite(id) || id <= 0) throw new CustomerioError('Provide a numeric broadcast_id.');
  const { period, steps, note } = cioPeriodArgs(args.period ?? '', args.steps);
  const itemType = String(args.type ?? '').trim().toLowerCase();
  const params = new URLSearchParams({ period, steps: String(steps) });
  if (itemType) params.set('type', itemType);
  const raw = await get(`/broadcasts/${encodeURIComponent(String(id))}/metrics?${params.toString()}`);
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return `Customer.io returned a non-JSON body for broadcast ${id} metrics: ${raw.slice(0, 200)}`;
  }
  const series = (parsed?.metric?.series ?? undefined) as MetricSeries | undefined;
  const out = cioRenderMetrics('Broadcast', id, series, period, steps, itemType || 'broadcast');
  const extras = [note, `Metrics are bucketed by ${period}, and Customer.io returns them oldest first.`].filter(Boolean);
  return extras.length ? `${out}\n\n${extras.join('\n')}` : out;
}

export interface CampaignMetricsArgs {
  campaign_id: string;
  period?: string;
  steps?: number;
}

/** The same delivery, open and click metrics for one automation, which is what tells you whether a journey is working. */
export async function campaignMetrics(args: CampaignMetricsArgs): Promise<string> {
  const id = Number(args.campaign_id);
  if (!Number.isFinite(id) || id <= 0) throw new CustomerioError('Provide a numeric campaign_id (automation id).');
  const { period, steps, note } = cioPeriodArgs(args.period ?? '', args.steps);
  const raw = await get(`/campaigns/${encodeURIComponent(String(id))}/metrics?period=${encodeURIComponent(period)}&steps=${steps}`);
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return `Customer.io returned a non-JSON body for automation ${id} metrics: ${raw.slice(0, 200)}`;
  }
  const series = (parsed?.metric?.series ?? parsed?.series ?? undefined) as MetricSeries | undefined;
  const out = cioRenderMetrics('Automation', id, series, period, steps, 'automation');
  const extras = [note, `Metrics are bucketed by ${period}, and Customer.io returns them oldest first.`].filter(Boolean);
  return extras.length ? `${out}\n\n${extras.join('\n')}` : out;
}

export interface SegmentMembersArgs {
  segment_id: string;
  limit?: number;
  start?: string;
}

/** Who is actually inside a segment, which is the membership behind every segment size you see in the dashboard. */
export async function segmentMembers(args: SegmentMembersArgs): Promise<string> {
  const id = Number(args.segment_id);
  if (!Number.isFinite(id) || id <= 0) throw new CustomerioError('Provide a numeric segment_id. It is on the segment page in the dashboard under Usage.');
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 50), 1), 1000);
  const params = new URLSearchParams({ limit: String(limit) });
  if (args.start) params.set('start', args.start);

  const raw = await get(`/segments/${encodeURIComponent(String(id))}/membership?${params.toString()}`);
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return `Customer.io returned a non-JSON body for segment ${id} membership: ${raw.slice(0, 200)}`;
  }
  // Customer.io answers with identifiers populated, or with an empty identifiers
  // array alongside a populated ids array. Testing identifiers on truthiness
  // rather than emptiness is what stops the ids form rendering as "no members".
  const identifierRows = Array.isArray(parsed?.identifiers) ? (parsed.identifiers as any[]) : [];
  const idRows = Array.isArray(parsed?.ids) ? (parsed.ids as string[]) : [];
  const identifiers = identifierRows.length > 0;
  const rows = identifiers ? identifierRows : idRows.map((x) => ({ id: x }));
  if (!rows.length) {
    return `Segment ${id} returned no members on this page. Either the segment is genuinely empty, or the next-page token has run off the end.`;
  }

  const withEmail = rows.filter((r) => r?.email).length;
  const lines = [
    `Members of segment ${id}: ${rows.length} returned on this page${identifiers ? `, ${withEmail} carrying an email address` : ' (id form, so no email addresses are returned)'}`,
    '',
  ];
  const width = Math.max(...rows.map((r) => String(r?.cio_id ?? '').length), 6);
  for (const r of rows.slice(0, limit)) {
    lines.push(`cio_id ${String(r?.cio_id ?? '?').padEnd(width)}  id ${String(r?.id ?? 'null').padEnd(12)} email ${r?.email ?? 'null'}`);
  }
  if (parsed?.next) {
    lines.push('', `More members exist. Pass start="${String(parsed.next).slice(0, 60)}" for the next page.`);
  } else {
    lines.push('', 'No next-page token came back, so this is the last page of the segment.');
  }
  return lines.join('\n');
}
