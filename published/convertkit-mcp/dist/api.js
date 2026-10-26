/**
 * Kit (ConvertKit) API v4 client. Needs KIT_API_KEY
 * (Kit Settings > Developer, free accounts included).
 * Docs: https://developers.kit.com/
 */
const BASE = "https://api.convertkit.com/v4";
export class KitError extends Error {
}
function headers() {
    const key = process.env.KIT_API_KEY;
    if (!key)
        throw new KitError("Set KIT_API_KEY first (Kit Settings > Developer).");
    return { "User-Agent": "convertkit-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new KitError("Kit rejected the key (401/403).");
    if (res.status === 404)
        throw new KitError("Not found.");
    if (!res.ok)
        throw new KitError(`Kit error ${res.status}`);
    return (await res.json());
}
export async function findSubscriber(email) {
    if (!email.includes("@"))
        throw new KitError(`Not an email: "${email}".`);
    const data = await getJson(`/subscribers?email_address=${encodeURIComponent(email.trim())}`);
    const rows = Array.isArray(data.subscribers) ? data.subscribers : [];
    const s = rows[0];
    if (!s)
        return null;
    return {
        email: s.email_address ?? s.email,
        firstName: s.first_name,
        state: s.state,
        created: s.created_at ? String(s.created_at).slice(0, 10) : undefined,
    };
}
export async function listForms(limit = 10) {
    const data = await getJson(`/forms?per_page=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.forms) ? data.forms : [];
    return rows.slice(0, limit).map((f) => ({ id: String(f.id), name: String(f.name ?? "?") }));
}
export async function listBroadcasts(limit = 10) {
    const data = await getJson(`/broadcasts?per_page=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.broadcasts) ? data.broadcasts : [];
    return rows.slice(0, limit).map((b) => ({ id: String(b.id), name: String(b.subject ?? b.name ?? "?") }));
}
export function formatNamed(rows, label) {
    if (rows.length === 0)
        return `No ${label}.`;
    return rows.map((r, i) => `${i + 1}. [${r.id}] ${r.name}`).join("\n");
}
// ---- muxD tools:
const kitNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
};
const kitPct = (v, digits = 2) => {
    const n = kitNum(v);
    return Number.isFinite(n) ? `${n.toFixed(digits)}%` : 'n/a';
};
const kitInt = (v) => {
    const n = kitNum(v);
    return Number.isFinite(n) ? Math.round(n).toLocaleString() : '?';
};
const kitRows = (payload, key) => {
    const rows = payload[key];
    return Array.isArray(rows) ? rows : [];
};
const kitTotal = (payload) => {
    const n = kitNum(payload.pagination?.total_count ?? payload.total_count);
    return Number.isFinite(n) ? n : null;
};
/** The retention Kit announced for email stats; surfacing it stops a 400 reading as a broken tool. */
const KIT_STATS_RETENTION = 'Kit is changing email-stat retention on 15 October 2026: stats stay available for 5 years and older broadcasts return 400.';
/** The tags on the account with how many subscribers each one actually holds, which shows which tags really segment the list. */
export async function listTags(args = {}) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 30), 1), 100);
    const data = await getJson(`/tags?per_page=${limit}&include_total_count=true`);
    const rows = kitRows(data, 'tags');
    if (!rows.length)
        return 'Kit returned no tags. Tags are created in Kit or through the API, usually by automations and forms.';
    const total = kitTotal(data);
    const counts = rows.map((t) => kitNum(t.subscriber_count)).filter((n) => Number.isFinite(n));
    const untagged = rows.filter((t) => !kitNum(t.subscriber_count)).length;
    const totalTagged = counts.reduce((s, n) => s + n, 0);
    const lines = [
        `Kit tags: ${rows.length} returned${total !== null ? ` of ${total} on the account` : ''}`,
        untagged
            ? `${untagged} tag(s) report no subscriber_count, so this page may understate how many people each one covers.`
            : `Subscribers across these tags (counting anyone tagged more than once): ${totalTagged.toLocaleString()}`,
        '',
        `${"tag".padEnd(38)}${"subscribers".padStart(12)}  id      created`,
    ];
    for (const t of [...rows].sort((a, b) => kitNum(b.subscriber_count) - kitNum(a.subscriber_count)).slice(0, limit)) {
        const created = String(t.created_at ?? '');
        lines.push(`${String(t.name ?? '?').slice(0, 38).padEnd(38)}${kitInt(t.subscriber_count).padStart(12)}  ${String(t.id ?? '?').padEnd(7)} ${created ? created.slice(0, 10) : '?'}`);
    }
    if (total !== null && total > rows.length) {
        lines.push('', `This is the first ${rows.length} of ${total} tags. Paginate with after=${data.pagination?.end_cursor ?? '<cursor>'} rather than raising limit past 100.`);
    }
    return lines.join('\n');
}
/** The automations on the account with their state, step count, audience size and how they have performed. */
export async function listSequences(args = {}) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 20), 1), 100);
    const data = await getJson(`/sequences?per_page=${limit}&include_total_count=true`);
    const rows = kitRows(data, 'sequences');
    if (!rows.length)
        return 'Kit returned no sequences. Sequences are the automated email series in Kit.';
    const total = kitTotal(data);
    const live = rows.filter((s) => s.active === true);
    const statsOf = (s) => (s.stats ?? {});
    const withStats = rows.filter((s) => Object.keys(statsOf(s)).length > 0);
    const lines = [
        `Kit sequences: ${rows.length} returned${total !== null ? ` of ${total} on the account` : ''}, ${live.length} active`,
        `Flags in use: hold ${rows.filter((s) => s.hold === true).length}, repeat ${rows.filter((s) => s.repeat === true).length}`,
        '',
        `${"sequence".padEnd(34)}${"state".padEnd(9)}${"steps".padStart(6)}${"subs".padStart(9)}${"open".padStart(8)}${"clicks".padStart(8)}${"unsub".padStart(8)}  id`,
    ];
    for (const s of [...rows].sort((a, b) => kitNum(b.subscriber_count) - kitNum(a.subscriber_count)).slice(0, limit)) {
        const st = statsOf(s);
        const state = s.active === true ? 'active' : s.active === false ? 'paused' : 'unknown';
        const openRate = kitNum(st.opens);
        const recip = kitNum(st.recipients);
        const lines2 = [
            String(s.name ?? '?').slice(0, 34).padEnd(34),
            state.padEnd(9),
            kitInt(s.email_count).padStart(6),
            kitInt(s.subscriber_count).padStart(9),
            (recip > 0 && Number.isFinite(openRate) ? `${((openRate / recip) * 100).toFixed(1)}%` : '?').padStart(8),
            kitInt(st.clicks).padStart(8),
            kitInt(st.unsubscribes ?? st.email_unsubscribes).padStart(8),
            `  ${String(s.id ?? '?')}`,
        ].join('');
        lines.push(lines2);
    }
    lines.push('', 'open is total opens divided by recipients; clicks and unsub are absolute counts for the sequence.');
    if (!withStats.length) {
        lines.push('', 'Kit returned no engagement stats for any sequence here. Stats only accrue once a sequence has actually sent, and are subject to the 5-year retention window.');
    }
    const pausedWithAudience = rows.filter((s) => s.active === false && kitNum(s.subscriber_count) > 0);
    if (pausedWithAudience.length) {
        lines.push(`Paused but still holding subscribers: ${pausedWithAudience.map((s) => `${s.name} (${kitInt(s.subscriber_count)})`).join(', ')}. Nobody is advancing through these until they are turned back on.`);
    }
    if (total !== null && total > rows.length) {
        lines.push('', `This is the first ${rows.length} of ${total} sequences; raise limit or paginate with after=${data.pagination?.end_cursor ?? '<cursor>'}.`);
    }
    return lines.join('\n');
}
const KIT_STATUSES = ['draft', 'scheduled', 'sending', 'sent'];
/** How broadcasts actually performed, with the tracking flags that decide whether a low number means anything. */
export async function broadcastPerformance(args = {}) {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 15), 1), 100);
    const status = String(args.status ?? '').trim();
    if (status && !KIT_STATUSES.includes(status)) {
        throw new KitError(`status must be one of ${KIT_STATUSES.join(', ')}.`);
    }
    for (const key of ['sent_after', 'sent_before']) {
        const raw = String(args[key] ?? '').trim();
        if (raw && !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?Z?)?$/.test(raw)) {
            throw new KitError(`${key} must look like 2026-01-31 or 2026-01-31T09:00:00Z.`);
        }
    }
    const params = new URLSearchParams({ per_page: String(limit), include_total_count: 'true' });
    if (status)
        params.set('status', status);
    if (args.sent_after)
        params.set('sent_after', String(args.sent_after).trim());
    if (args.sent_before)
        params.set('sent_before', String(args.sent_before).trim());
    let data;
    try {
        data = await getJson(`/broadcasts/stats?${params.toString()}`);
    }
    catch (e) {
        // Kit answers 400 for broadcasts outside the retention window, which is easy
        // to mistake for a malformed request.
        const why = e instanceof Error ? e.message : String(e);
        // Only explain the retention window when a 400 is what actually came back;
        // appending it to a missing-key error would send the caller down the wrong path.
        throw new KitError(/\b400\b/.test(why)
            ? `${why} That is what Kit returns for a broadcast older than the 5-year window. ${KIT_STATS_RETENTION}`
            : why);
    }
    const rows = kitRows(data, 'broadcasts');
    if (!rows.length) {
        return `Kit returned no broadcast stats${status ? ` with status ${status}` : ''}${args.sent_after ? ` sent after ${args.sent_after}` : ''}. Draft and scheduled broadcasts have no stats until they send.`;
    }
    const total = kitTotal(data);
    const sent = rows.filter((b) => b.stats?.status === 'sent' || kitNum(b.stats?.recipients) > 0);
    const scored = sent.filter((b) => kitNum(b.stats?.recipients) > 0);
    const openHidden = rows.filter((b) => b.stats?.open_tracking_disabled === true);
    const clickHidden = rows.filter((b) => b.stats?.click_tracking_disabled === true);
    const rates = scored.map((b) => kitNum(b.stats.open_rate)).filter((n) => Number.isFinite(n));
    const lines = [
        `Kit broadcast stats: ${rows.length} returned${total !== null ? ` of ${total} matching` : ''}, ${scored.length} with recipients recorded`,
        rates.length
            ? `Open rate across those ${rates.length}: median ${rates.slice().sort((a, b) => a - b)[Math.floor(rates.length / 2)]?.toFixed(2)}%, best ${Math.max(...rates).toFixed(2)}%, worst ${Math.min(...rates).toFixed(2)}%`
            : 'No open rates recorded on this page.',
        '',
        // Kit's bulk stats payload carries no bounce field, so there is no bounce column to show.
        `${"sent".padEnd(11)}${"subject".padEnd(38)}${"recip".padStart(7)}${"open".padStart(8)}${"click".padStart(8)}${"unsub".padStart(8)}`,
    ];
    for (const b of [...rows].sort((a, b) => String(b.send_at ?? '').localeCompare(String(a.send_at ?? ''))).slice(0, limit)) {
        const st = (b.stats ?? {});
        const sentAt = String(b.send_at ?? '');
        lines.push(`${(sentAt ? sentAt.slice(0, 10) : '?').padEnd(11)}` +
            `${String(b.subject ?? '(no subject)').slice(0, 38).padEnd(38)}` +
            `${kitInt(st.recipients).padStart(7)}${kitPct(st.open_rate).padStart(8)}${kitPct(st.click_rate).padStart(8)}` +
            `${kitPct(st.unsubscribe_rate).padStart(8)}`);
    }
    if (rows.length > limit)
        lines.push('', `...and ${rows.length - limit} more; raise limit or paginate.`);
    const notes = [];
    if (openHidden.length) {
        const names = openHidden.slice(0, 5).map((b) => String(b.subject ?? '(no subject)').slice(0, 50));
        notes.push(`Open tracking was off for ${openHidden.length} broadcast(s) (${names.join('; ')}${openHidden.length > 5 ? ' and more' : ''}), so a low or zero open rate there is a measurement gap, not a failure to engage.`);
    }
    if (clickHidden.length) {
        notes.push(`Click tracking was off for ${clickHidden.length} broadcast(s), so their click rate is not comparable with the rest.`);
    }
    if (openHidden.length || clickHidden.length)
        notes.push(KIT_STATS_RETENTION);
    if (notes.length)
        lines.push('', ...notes);
    return lines.join('\n');
}
