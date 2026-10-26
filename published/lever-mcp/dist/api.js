const BASE = 'https://api.lever.co/v0/postings';
const UA = 'mrfentmen-lever-mcp/1.0';
export class LeverError extends Error {
}
const clamp = (value, fallback, max) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const companySlug = (company) => {
    const value = String(company ?? '').trim();
    if (!value)
        throw new LeverError('Provide a company slug.');
    return encodeURIComponent(value);
};
async function fetchPostings(company) {
    const slug = companySlug(company);
    const res = await fetch(`${BASE}/${slug}?mode=json`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    // Lever answers unknown boards with 404/"Document not found", which is a
    // wrong-slug problem, not a transient failure.
    if (res.status === 404) {
        throw new LeverError(`No Lever board named "${company}". Check the slug (Lever boards live at jobs.lever.co/<slug>).`);
    }
    if (!res.ok)
        throw new LeverError(`Lever returned ${res.status} for board "${company}".`);
    const d = (await res.json());
    return Array.isArray(d) ? d : [];
}
const posted = (epoch) => {
    if (!epoch)
        return '?';
    const date = new Date(epoch);
    return Number.isNaN(date.getTime()) ? '?' : date.toISOString().slice(0, 10);
};
const brief = (posting, index) => {
    const cat = posting.categories ?? {};
    return `${index + 1}. ${posting.text ?? '?'} [${cat.commitment ?? '?'}] ${cat.location ?? '?'}` +
        `${cat.team ? ` | team ${cat.team}` : ''}${posting.workplaceType ? ` | ${posting.workplaceType}` : ''}` +
        `${posting.hostedUrl ? `\n   ${posting.hostedUrl}` : ''}`;
};
export async function postings(args) {
    const limit = clamp(args?.limit, 15, 30);
    const d = await fetchPostings(args.company);
    if (!d.length)
        return `No postings for "${args.company}".`;
    return `Lever postings for "${args.company}" (${d.length}):\n` + d.slice(0, limit).map(brief).join('\n');
}
export async function posting(args) {
    const id = String(args?.posting_id ?? '').trim();
    if (!id)
        throw new Error('posting_id is required.');
    const res = await fetch(`${BASE}/${companySlug(args.company)}/${encodeURIComponent(id)}?mode=json`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Lever returned ${res.status}`);
    const found = (await res.json());
    const cat = found.categories ?? {};
    return `${found.text ?? '?'} at ${args.company}\n` +
        `Commitment: ${cat.commitment ?? '?'} | Location: ${cat.location ?? '?'} | Team: ${cat.team ?? '?'}\n` +
        `Workplace: ${found.workplaceType ?? '?'} | Posted: ${posted(found.createdAt)}\n` +
        `Apply: ${found.applyUrl ?? found.hostedUrl ?? '?'}\n\n` +
        String(found.descriptionPlain ?? '').replace(/\s+/g, ' ').trim().slice(0, 4000);
}
export async function searchPostings(args) {
    const query = String(args?.query ?? '').trim().toLowerCase();
    if (!query)
        throw new Error('query is required.');
    const limit = clamp(args?.limit, 15, 30);
    const list = await fetchPostings(args.company);
    const hits = list.filter((entry) => {
        const cat = entry.categories ?? {};
        return `${entry.text ?? ''} ${cat.team ?? ''} ${cat.department ?? ''} ${cat.location ?? ''} ${cat.commitment ?? ''}`
            .toLowerCase()
            .includes(query);
    });
    if (!hits.length)
        return `No postings for "${args.company}" match "${args.query}" (searched ${list.length}).`;
    return `Lever postings at "${args.company}" matching "${args.query}" (${hits.length} of ${list.length}):\n` +
        hits.slice(0, limit).map(brief).join('\n');
}
/** Newest postings first — Lever returns boards in an arbitrary order. */
export async function recentPostings(args) {
    const limit = clamp(args?.limit, 15, 30);
    const list = await fetchPostings(args.company);
    if (!list.length)
        return `No postings for "${args.company}".`;
    const sorted = [...list].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return (`Newest Lever postings at "${args.company}" (${sorted.length} open, showing ${Math.min(limit, sorted.length)}):\n` +
        sorted.slice(0, limit).map((p, i) => `${brief(p, i)}\n   posted ${posted(p.createdAt)}`).join('\n'));
}
/** Postings grouped by department, the field separate from team. */
export async function departments(args) {
    const list = await fetchPostings(args.company);
    if (!list.length)
        return `No postings for "${args.company}".`;
    const counts = new Map();
    for (const entry of list) {
        const key = entry.categories?.department ?? 'unassigned';
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return (`Lever departments at "${args.company}" (${ranked.length} hiring, ${list.length} postings):\n` +
        ranked.map(([dept, count], i) => `${i + 1}. ${dept} - ${count} posting(s)`).join('\n'));
}
export async function teams(args) {
    const list = await fetchPostings(args.company);
    if (!list.length)
        return `No postings for "${args.company}".`;
    const counts = new Map();
    for (const entry of list) {
        const team = entry.categories?.team ?? entry.categories?.department ?? 'unassigned';
        counts.set(team, (counts.get(team) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return `Lever teams at "${args.company}" (${ranked.length} hiring, ${list.length} postings):\n` +
        ranked.map(([team, count], i) => `${i + 1}. ${team} - ${count} posting(s)`).join('\n');
}
export async function locations(args) {
    const list = await fetchPostings(args.company);
    if (!list.length)
        return `No postings for "${args.company}".`;
    const counts = new Map();
    for (const entry of list) {
        const place = entry.categories?.location ?? 'unlisted';
        counts.set(place, (counts.get(place) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return `Lever locations at "${args.company}" (${ranked.length} places, ${list.length} postings):\n` +
        ranked.map(([place, count], i) => `${i + 1}. ${place} - ${count} posting(s)`).join('\n');
}
// ---- batch-4 tools: server-side grouping and recency filter (2026-09-27) ----
const GROUP_FIELDS = {
    team: "team",
    department: "department",
    location: "location",
    commitment: "commitment",
};
/** Lever groups the board server-side with ?group=; this reads that structure. */
export async function groupedPostings(args) {
    const wanted = String(args?.group_by ?? "team").trim().toLowerCase();
    const field = GROUP_FIELDS[wanted];
    if (!field)
        throw new LeverError(`Group by one of: ${Object.keys(GROUP_FIELDS).join(", ")}.`);
    const samples = Math.min(Math.max(Math.round(Number(args?.samples ?? 3)) || 3, 1), 10);
    const res = await fetch(`${BASE}/${companySlug(args.company)}?mode=json&group=${field}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404) {
        throw new LeverError(`No Lever board named "${args.company}". Check the slug (Lever boards live at jobs.lever.co/<slug>).`);
    }
    if (!res.ok)
        throw new LeverError(`Lever returned ${res.status} for board "${args.company}".`);
    const data = (await res.json());
    if (!Array.isArray(data)) {
        throw new LeverError(`Lever did not group this board by ${field} - the board may be empty.`);
    }
    const groups = data
        .map((row) => ({
        title: String(row?.title ?? "unassigned"),
        postings: Array.isArray(row?.postings) ? row.postings : [],
    }))
        .sort((a, b) => b.postings.length - a.postings.length);
    const total = groups.reduce((sum, g) => sum + g.postings.length, 0);
    if (!total)
        return `No postings for "${args.company}".`;
    const lines = groups.map((g, i) => {
        const head = `${i + 1}. ${g.title} - ${g.postings.length} posting(s)`;
        const picks = g.postings.slice(0, samples).map((p) => {
            const cat = p?.categories ?? {};
            return `   · ${p?.text ?? "?"}${cat.location ? ` | ${cat.location}` : ""}${p?.workplaceType ? ` | ${p.workplaceType}` : ""}`;
        });
        return [head, ...picks].join("\n");
    });
    return [
        `Lever postings at "${args.company}" grouped by ${field} (${groups.length} group(s), ${total} postings):`,
        "",
        lines.join("\n"),
        "",
        `Grouped server-side by Lever; showing up to ${samples} posting(s) per group.`,
    ].join("\n");
}
/** Postings that appeared on the board on or after a date - the "what is new" question. */
export async function newestSince(args) {
    const raw = String(args?.since ?? "").trim();
    const cutoff = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? Date.parse(`${raw}T00:00:00Z`) : Date.parse(raw);
    if (!Number.isFinite(cutoff)) {
        throw new LeverError(`Could not read "${args?.since}" as a date - use YYYY-MM-DD, for example 2026-09-01.`);
    }
    const limit = clamp(args?.limit, 20, 40);
    const list = await fetchPostings(args.company);
    if (!list.length)
        return `No postings for "${args.company}".`;
    const fresh = list
        .filter((p) => (p.createdAt ?? 0) >= cutoff)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    const oldest = list.reduce((min, p) => Math.min(min, p.createdAt ?? min), Number.POSITIVE_INFINITY);
    const share = ((fresh.length / list.length) * 100).toFixed(1);
    const head = [
        `Lever postings at "${args.company}" created on or after ${raw}:`,
        `${fresh.length} of ${list.length} open posting(s) (${share}% of the board)`,
        Number.isFinite(oldest) ? `Oldest posting still open: ${posted(oldest)}` : "",
    ].filter(Boolean);
    if (!fresh.length) {
        return [...head, "", `Nothing new since ${raw}. The board has not changed in that window.`].join("\n");
    }
    return [
        ...head,
        "",
        fresh.slice(0, limit).map((p, i) => `${brief(p, i)}\n   posted ${posted(p.createdAt)}`).join("\n"),
    ].join("\n");
}
async function leverPostings(company) {
    const slug = companySlug(company);
    const res = await fetch(`${BASE}/${slug}?mode=json`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new LeverError(`The Lever API returned ${res.status} for company "${company}".`);
    const text = await res.text();
    if (!text.trim())
        throw new LeverError('The Lever API returned an empty body.');
    const data = JSON.parse(text);
    if (!Array.isArray(data))
        throw new LeverError('The Lever API did not return a posting list.');
    return data;
}
const daysSince = (epoch) => {
    if (typeof epoch !== 'number' || epoch <= 0)
        return Number.NaN;
    return Math.round((Date.now() - epoch) / 86_400_000);
};
const medianOf = (values) => {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
const cellOf = (posting) => {
    const categories = (posting.categories ?? {});
    const age = daysSince(posting.createdAt);
    return {
        team: String(categories.team ?? 'team not reported'),
        commitment: String(categories.commitment ?? 'commitment not reported'),
        location: String(categories.location ?? 'location not reported'),
        level: String(categories.level ?? 'level not reported'),
        ageDays: age,
        createdAt: typeof posting.createdAt === 'number' ? new Date(posting.createdAt).toISOString().slice(0, 10) : 'not reported',
        title: String(posting.text ?? 'untitled'),
        workplaceType: String(posting.workplaceType ?? 'not reported'),
    };
};
/** How fast a company is hiring: how many roles opened inside a window and how old the backlog is. */
export async function hiringVelocity(args) {
    const company = String(args?.company ?? '').trim();
    if (!company)
        throw new LeverError('Provide a company slug.');
    const window = Math.min(Math.max(Number(args?.days ?? 90) || 90, 1), 3650);
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
    const list = await leverPostings(company);
    if (!list.length)
        throw new LeverError(`Lever lists no open postings for "${company}".`);
    const cells = list.map(cellOf);
    const ages = cells.map((cell) => cell.ageDays).filter((age) => Number.isFinite(age));
    if (!ages.length)
        throw new LeverError(`None of the ${list.length} postings for "${company}" carries a createdAt date.`);
    const fresh = ages.filter((age) => age <= window);
    const median = medianOf(ages);
    const lines = [
        `Hiring velocity at ${company} on the Lever board: ${list.length} open posting(s)`,
        `Opened in the last ${window} day(s): ${fresh.length} (${((fresh.length / ages.length) * 100).toFixed(1)}% of dated postings)`,
        `Median age of an open role: ${median === null ? 'not reported' : `${median} day(s)`} · newest ${Math.min(...ages)}d · oldest ${Math.max(...ages)}d`,
        '',
    ];
    for (const [i, cell] of cells.sort((a, b) => a.ageDays - b.ageDays).slice(0, limit).entries()) {
        lines.push(`  ${i + 1}. ${cell.title.slice(0, 70)} | ${cell.team} | ${cell.commitment} | opened ${cell.ageDays} day(s) ago (${cell.createdAt})`);
    }
    if (cells.length > limit)
        lines.push(`  ...and ${cells.length - limit} more open role(s).`);
    return lines.join('\n');
}
/** How several companies are hiring side by side, from their public Lever boards. */
export async function companyComparison(args) {
    const wanted = (args?.companies ?? []).map((value) => String(value).trim()).filter(Boolean).slice(0, 6);
    if (!wanted.length)
        throw new LeverError('Provide up to six company slugs to compare.');
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 25);
    const rows = [];
    for (const company of wanted) {
        try {
            const list = await leverPostings(company);
            const cells = list.map(cellOf);
            const ages = cells.map((cell) => cell.ageDays).filter((age) => Number.isFinite(age));
            rows.push({
                company,
                ok: true,
                count: list.length,
                median: medianOf(ages),
                fresh: ages.filter((age) => age <= 90).length,
                teams: new Set(cells.map((cell) => cell.team)).size,
                remote: cells.filter((cell) => /remote/i.test(cell.workplaceType) || /remote/i.test(cell.location)).length,
                levels: Array.from(new Set(cells.map((cell) => cell.level))).slice(0, 6),
            });
        }
        catch (e) {
            rows.push({ company, ok: false, note: e.message });
        }
    }
    const lines = [
        `Hiring comparison across ${wanted.length} public Lever board(s)`,
        '',
        '  company      open  new(90d)  median age  teams  remote-looking  levels',
    ];
    for (const row of rows) {
        if (!row.ok) {
            lines.push(`  ${row.company.padEnd(12)} unavailable: ${(row.note ?? '').slice(0, 60)}`);
            continue;
        }
        lines.push(`  ${row.company.padEnd(12)} ${String(row.count ?? 0).padStart(4)}  ${String(row.fresh ?? 0).padStart(7)}  ${String(row.median ?? '?').padStart(10)}  ${String(row.teams ?? 0).padStart(5)}  ${String(row.remote ?? 0).padStart(15)}  ${(row.levels ?? []).join(', ') || 'not reported'}`);
    }
    const live = rows.filter((row) => row.ok);
    if (live.length) {
        const busiest = live.reduce((a, b) => ((b.count ?? 0) > (a.count ?? 0) ? b : a));
        const freshest = live.reduce((a, b) => ((b.fresh ?? 0) > (a.fresh ?? 0) ? b : a));
        lines.push('');
        lines.push(`Most openings: ${busiest.company} with ${busiest.count}. Most roles opened in the last 90 days: ${freshest.company} with ${freshest.fresh}.`);
    }
    const dead = rows.filter((row) => !row.ok);
    if (dead.length)
        lines.push(`${dead.length} board(s) could not be read; a missing slug answers 404, which is not the same as a company with no openings.`);
    return lines.join('\n');
}
