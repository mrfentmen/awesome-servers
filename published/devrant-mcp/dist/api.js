const UA = 'mrfentmen-devrant-mcp/1.0';
export async function rants(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
    const res = await fetch('https://devrant.com/api/devrant/rants?app=3&sort=algo&limit=10', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`devRant returned ${res.status}`);
    const d = (await res.json());
    const list = d.rants ?? [];
    if (!list.length)
        return 'No rants returned.';
    return `devRant (${list.length}, showing ${Math.min(limit, list.length)}):\n` +
        list.slice(0, limit).map((r, i) => `${i + 1}. @${r.user_username ?? '?'} (${r.num_upvotes ?? 0} up, ${r.num_comments ?? 0} comments): ${(r.text ?? '').slice(0, 150)}`).join('\n');
}
// ---- muxE tools:
// The one existing tool reads a page of the rants route and prints one line per
// rant. The new ones ask two questions that page cannot answer: what is inside
// one rant including its comment thread, and what the whole page adds up to.
const DR_BASE = 'https://devrant.com/api/devrant';
const DR_UA = 'mrfentmen-devrant-mcp/1.0';
/**
 * devRant is intermittent: the same url answers 200 and then 500 "Slim
 * Application Error" moments later, verified live on /rants?app=3 where three
 * consecutive calls in a row produced a 500, and on /rants/<id> where roughly
 * every other call did. A 500 is retried a bounded number of times so a flaky
 * upstream does not read as a broken tool.
 */
async function drGet(path) {
    let lastStatus = 0;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const res = await fetch(`${DR_BASE}${path}`, {
            headers: { 'User-Agent': DR_UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        const raw = await res.text();
        lastStatus = res.status;
        if (res.status === 500) {
            if (attempt < 3) {
                await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
                continue;
            }
            throw new Error('devRant answered 500 Slim Application Error for that request three times in a row, which it does intermittently; try again in a moment.');
        }
        if (res.status === 405) {
            throw new Error('devRant refused that route with 405; only the rants list and the single rant routes are open.');
        }
        if (!res.ok) {
            let why = `devRant returned ${res.status}`;
            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed?.error === 'string')
                    why = `devRant said: ${parsed.error}`;
                else if (typeof parsed?.message === 'string')
                    why = `devRant said: ${parsed.message}`;
            }
            catch {
                // the body was not the JSON envelope, so the status is all we have
            }
            throw new Error(why);
        }
        try {
            return JSON.parse(raw);
        }
        catch {
            throw new Error('devRant returned a body that is not JSON.');
        }
    }
    throw new Error(`devRant returned ${lastStatus} and the retries did not clear it.`);
}
const SORTS = ['algo', 'new', 'hot', 'top'];
const drStamp = (seconds) => typeof seconds === 'number' && Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'not reported';
const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
export async function rantDigest(args = {}) {
    const app = Math.max(1, Math.min(Math.floor(Number(args?.app ?? 3) || 3), 9999));
    const asked = (args?.sort ?? 'algo').trim().toLowerCase();
    const sort = SORTS.includes(asked) ? asked : 'algo';
    const limit = Math.max(1, Math.min(Math.floor(Number(args?.limit ?? 25) || 25), 50));
    const body = await drGet(`/rants?app=${app}&sort=${sort}&limit=${limit}`);
    if (body?.success === false)
        throw new Error(`devRant said: ${body.error ?? 'the request was refused'}`);
    const rants = Array.isArray(body.rants) ? body.rants : [];
    if (!rants.length)
        throw new Error(`devRant returned no rants for app ${app} with sort ${sort}.`);
    const scores = rants.map((r) => r.score ?? 0);
    const comments = rants.map((r) => r.num_comments ?? 0);
    const tags = new Map();
    const authors = new Map();
    for (const r of rants) {
        for (const t of Array.isArray(r.tags) ? r.tags : [])
            tags.set(t, (tags.get(t) ?? 0) + 1);
        const who = r.user_username ?? 'not reported';
        authors.set(who, (authors.get(who) ?? 0) + 1);
    }
    const rankedTags = [...tags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const rankedAuthors = [...authors.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const times = rants.map((r) => r.created_time).filter((t) => typeof t === 'number');
    const withImage = rants.filter((r) => typeof r.attached_image === 'string' && r.attached_image).length;
    const special = rants.filter((r) => r.special === true).length;
    const edited = rants.filter((r) => r.edited === true).length;
    const links = rants.reduce((a, r) => a + (Array.isArray(r.links) ? r.links.length : 0), 0);
    const lines = [
        `devRant page for app ${app}, sort ${sort}${sort !== asked ? ` (asked for ${asked}, which devRant does not offer, so algo was used)` : ''}:`,
        `  rants returned: ${rants.length}`,
        `  asked for ${limit}${rants.length < limit ? `, and devRant sent fewer, so every total below covers only the ${rants.length} it returned` : ''}`,
        `  score: highest ${Math.max(...scores)}, median ${median(scores)}, lowest ${Math.min(...scores)}, total ${scores.reduce((a, b) => a + b, 0).toLocaleString('en-US')}`,
        `  comments: highest ${Math.max(...comments)}, median ${median(comments)}, total ${comments.reduce((a, b) => a + b, 0).toLocaleString('en-US')}`,
        `  with no comments at all: ${comments.filter((c) => c === 0).length}`,
        `  marked special: ${special}, edited: ${edited}, with an attached image: ${withImage}`,
        `  links embedded in the rant text: ${links}`,
    ];
    if (times.length) {
        const newest = Math.max(...times);
        const oldest = Math.min(...times);
        const spanDays = Math.max(1, Math.round((newest - oldest) / 86400));
        lines.push(`  posted between ${drStamp(oldest)} and ${drStamp(newest)}, a span of ${spanDays} day(s)`);
    }
    lines.push(`  distinct tags: ${rankedTags.length}`);
    lines.push(`    ${rankedTags.slice(0, 12).map(([t, n]) => `${t} (${n})`).join(', ')}${rankedTags.length > 12 ? `, and ${rankedTags.length - 12} more` : ''}`);
    lines.push(`  distinct authors: ${rankedAuthors.length}`);
    lines.push(`    ${rankedAuthors.slice(0, 12).map(([a, n]) => `${a} (${n})`).join(', ')}${rankedAuthors.length > 12 ? `, and ${rankedAuthors.length - 12} more` : ''}`);
    lines.push('  every figure above is tallied from the rants on this one page, not from a stored summary.');
    return lines.join('\n');
}

const DEVRANT = 'https://devrant.com/api/devrant';
export async function rantDetails(args = {}) {
    const id = Number(args?.rant_id);
    if (!Number.isInteger(id) || id < 1)
        throw new Error('Provide a rant id, like 194632.');
    const app = Number(args?.app ?? 3) || 3;
    const res = await fetch(`${DEVRANT}/rants/${id}?app=${app}&sort=algo`, {
        headers: { 'User-Agent': 'mrfentmen-devrant-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`devRant returned ${res.status}`);
    const body = (await res.json());
    if (body.error || !body.rant)
        throw new Error(`devRant has no rant ${id}`);
    const r = body.rant;
    const comments = Array.isArray(body.comments) ? body.comments : [];
    return [
        `Rant ${r.id} by ${r.user_username ?? 'unknown'} (author score ${r.user_score ?? '?'})`,
        `Score: ${r.score ?? '?'} · comments: ${r.num_comments ?? comments.length} · posted ${new Date(Number(r.created_time) * 1000).toISOString().slice(0, 10)}`,
        `Tags: ${(r.tags ?? []).join(', ') || 'none'}${r.edited ? ' · edited' : ''}${r.attached_image ? ` · image ${r.attached_image}` : ''}`,
        (r.links ?? []).length ? `Links: ${r.links.join(', ')}` : '',
        '',
        String(r.text ?? '').trim(),
        '',
        comments.length ? `${comments.length} comment(s):` : 'No comments loaded.',
        ...comments.slice(0, 8).map((c) => `- ${c.user_username ?? 'anon'} (score ${c.score ?? '?'}): ${String(c.body ?? '').replace(/\s+/g, ' ').slice(0, 160)}`),
        `https://devrant.com/rants/${r.id}`,
    ].filter(Boolean).join('\n');
}
