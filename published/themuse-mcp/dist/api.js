const UA = 'mrfentmen-themuse-mcp/1.0 (https://github.com/mrfentmen)';
const BASE = 'https://www.themuse.com/api/public';
export class MuseError extends Error {
}
const clamp = (value, fallback, max) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const plain = (html) => String(html ?? '').replace(new RegExp("<[^>]+>", "g"), ' ').replace(new RegExp("&[a-z#0-9]+;", "gi"), ' ').replace(new RegExp("\\s+", "g"), ' ').trim();
const names = (list) => (list ?? []).map((entry) => entry.name).filter(Boolean).join(', ') || 'n/a';
const posted = (value) => String(value ?? '?').slice(0, 10);
/** Levels the Muse API accepts for the `level` filter. */
export const MUSE_LEVELS = [
    'Internship',
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Management',
    'Executive',
];
function buildQuery(page, filters = {}) {
    const params = new URLSearchParams({ page: String(clamp(page, 1, 20000)) });
    const level = (filters.level ?? '').trim();
    const location = (filters.location ?? '').trim();
    if (level)
        params.set('level', level);
    if (location)
        params.set('location', location);
    return params.toString();
}
async function fetchPage(page, filters = {}) {
    const url = `${BASE}/jobs?${buildQuery(page, filters)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new MuseError(`The Muse returned ${res.status} for ${url}`);
    const d = (await res.json());
    return { pageCount: d.page_count ?? 0, total: d.total ?? 0, results: d.results ?? [] };
}
const row = (job, index) => `${index + 1}. ${job.name ?? '?'} at ${job.company?.name ?? '?'} | ${names(job.locations)}` +
    ` | ${names(job.levels)} | ${names(job.categories)} | posted ${posted(job.publication_date)}` +
    (job.id ? `\n   id ${job.id}` : '');
export async function jobs(args) {
    const limit = clamp(args?.limit, 5, 40);
    const { pageCount, total, results } = await fetchPage(args?.page ?? 1, args);
    const page = clamp(args?.page, 1, 20000);
    if (!results.length)
        return `No Muse jobs on page ${page}.`;
    return (`The Muse jobs (page ${page} of ${pageCount.toLocaleString()}, ${total.toLocaleString()} total, showing ${Math.min(limit, results.length)}):\n` +
        results.slice(0, limit).map(row).join('\n'));
}
export async function job(args) {
    const id = Number(args?.job_id);
    if (!Number.isFinite(id) || id <= 0)
        throw new MuseError('job_id must be a numeric Muse job id.');
    const res = await fetch(`${BASE}/jobs/${id}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new MuseError(`No Muse job with id ${id}.`);
    if (!res.ok)
        throw new MuseError(`The Muse returned ${res.status}`);
    const found = (await res.json());
    return `${found.name ?? '?'} at ${found.company?.name ?? '?'}\n` +
        `Location: ${names(found.locations)}\n` +
        `Level: ${names(found.levels)} | Type: ${found.type ?? '?'} | Category: ${names(found.categories)}\n` +
        `Tags: ${names(found.tags)}\n` +
        `Published: ${posted(found.publication_date)}\n` +
        `${found.refs?.landing_page ?? ''}\n\n` +
        plain(found.contents).slice(0, 4000);
}
/**
 * Browse with the Muse server-side filters instead of scanning the feed:
 * level alone narrows 400k roles to roughly 150k, and level+location cuts it
 * far further, so an agent asking for "senior jobs in Berlin" gets real hits.
 */
export async function findJobs(args) {
    const level = (args.level ?? '').trim();
    const location = (args.location ?? '').trim();
    if (!level && !location) {
        return `Give a level, a location, or both. Levels: ${MUSE_LEVELS.join(', ')}. Example location: 'Remote', 'New York, NY', 'London, UK'.`;
    }
    const limit = clamp(args.limit, 5, 40);
    const { pageCount, total, results } = await fetchPage(args.page ?? 1, { level, location });
    if (!results.length) {
        return `No Muse jobs for level "${level || 'any'}" in "${location || 'anywhere'}".`;
    }
    return (`Muse jobs${level ? ` at level ${level}` : ''}${location ? ` in ${location}` : ''} — ` +
        `${total.toLocaleString()} total (page ${args.page ?? 1} of ${pageCount.toLocaleString()}):\n` +
        results.slice(0, limit).map(row).join('\n'));
}
/** All open roles at one company, found by scanning recent postings. */
export async function companyJobs(args) {
    const company = (args.company ?? '').trim();
    if (!company)
        return 'Provide a company name, e.g. "Uber" or "Genius AI".';
    const pages = clamp(args.pages, 5, 10);
    const limit = clamp(args.limit, 20, 40);
    const want = company.toLowerCase();
    const fetched = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1)));
    const list = fetched.flatMap((page) => page.results);
    const hits = list.filter((entry) => (entry.company?.name ?? '').toLowerCase().includes(want));
    if (!hits.length) {
        return `No postings from a company matching "${company}" in the newest ${list.length} Muse jobs. Try company_insights or a different name.`;
    }
    return (`Muse jobs at companies matching "${company}" (${hits.length} of the newest ${list.length}):\n` +
        hits.slice(0, limit).map(row).join('\n'));
}
/**
 * Keyword search over the newest postings. The Muse API has no free-text
 * search parameter, so this samples recent pages and matches client-side.
 * Combine with a level/location to narrow what gets sampled.
 */
export async function searchJobs(args) {
    const query = String(args?.query ?? '').trim().toLowerCase();
    if (!query)
        return 'Provide words to match, e.g. "data analyst" or "remote".';
    const pages = clamp(args.pages, 3, 10);
    const limit = clamp(args.limit, 10, 40);
    const filters = { level: (args.level ?? '').trim(), location: (args.location ?? '').trim() };
    const fetched = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1, filters)));
    const list = fetched.flatMap((page) => page.results);
    const hits = list.filter((entry) => `${entry.name ?? ''} ${entry.company?.name ?? ''} ${names(entry.locations)} ${names(entry.categories)} ${names(entry.levels)} ${names(entry.tags)}`
        .toLowerCase()
        .includes(query));
    if (!hits.length)
        return `No Muse jobs match "${args.query}" in the newest ${list.length} postings.`;
    return (`Muse jobs matching "${args.query}" (${hits.length} of the newest ${list.length}):\n` +
        hits.slice(0, limit).map(row).join('\n'));
}
/** Aggregate view of who is hiring, where and at what level, for a filter. */
export async function jobInsights(args) {
    const pages = clamp(args.pages, 5, 10);
    const filters = { level: (args.level ?? '').trim(), location: (args.location ?? '').trim() };
    const fetched = await Promise.all(Array.from({ length: pages }, (_, i) => fetchPage(i + 1, filters)));
    const list = fetched.flatMap((page) => page.results);
    if (!list.length)
        return 'No Muse jobs matched that filter.';
    const total = fetched[0]?.total ?? list.length;
    const tally = (values) => {
        const m = new Map();
        for (const v of values)
            if (v && v !== 'n/a')
                m.set(v, (m.get(v) ?? 0) + 1);
        return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    };
    const block = (label, rows) => rows.length ? `${label}:\n${rows.map(([k, v]) => `  ${k} — ${v}`).join('\n')}` : '';
    const companies = tally(list.map((j) => j.company?.name ?? ''));
    const places = tally(list.flatMap((j) => (j.locations ?? []).map((l) => l.name ?? '')));
    const levels = tally(list.flatMap((j) => (j.levels ?? []).map((l) => l.name ?? '')));
    const cats = tally(list.flatMap((j) => (j.categories ?? []).map((c) => c.name ?? '')));
    return [
        `Muse job market${filters.level ? ` at ${filters.level}` : ''}${filters.location ? ` in ${filters.location}` : ''}: ${total.toLocaleString()} open roles (sampled ${list.length}).`,
        '',
        block('Top employers', companies),
        block('Top locations', places),
        block('Levels', levels),
        block('Categories', cats),
    ]
        .filter(Boolean)
        .join('\n');
}
/** The company directory is a separate endpoint from the jobs feed. */
async function fetchCompanies(page) {
    const url = `${BASE}/companies?page=${clamp(page, 1, 20000)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new MuseError(`The Muse returned ${res.status} for ${url}`);
    const d = (await res.json());
    return { pageCount: d.page_count ?? 0, total: d.total ?? 0, results: d.results ?? [] };
}
const companyLine = (company, index) => `${index + 1}. ${company.name ?? '?'} — ${names(company.industries)} | ${names(company.locations)} | ${company.size?.name ?? 'size n/a'}` +
    (company.refs?.landing_page ? `\n   ${company.refs.landing_page}` : '');
/**
 * The employer directory: every company The Muse profiles, with its industries,
 * locations and size, which no job tool exposes.
 */
export async function listCompanies(args) {
    const page = Math.max(Math.trunc(args.page ?? 1), 1);
    const limit = clamp(args.limit, 10, 40);
    const { pageCount, total, results } = await fetchCompanies(page);
    if (!results.length)
        return `No companies on page ${page} of The Muse directory.`;
    return [
        `The Muse companies — ${total.toLocaleString()} profiled (page ${page} of ${pageCount.toLocaleString()})`,
        '',
        ...results.slice(0, limit).map(companyLine),
        results.length > limit ? `\nShowing ${limit} of ${results.length} on this page.` : '',
    ].filter((line) => line !== '').join('\n');
}
/**
 * Find a company by name across the directory. The directory has no search
 * parameter, so several pages are scanned and the matches reported with the
 * page each was found on.
 */
export async function companySearch(args) {
    const wanted = (args.name ?? '').trim().toLowerCase();
    if (wanted.length < 2)
        throw new MuseError("Give at least two characters of a company name.");
    const pages = Math.min(Math.max(Math.trunc(args.pages ?? 5), 1), 20);
    const hits = [];
    let total = 0;
    for (let page = 1; page <= pages; page += 1) {
        const { total: count, results } = await fetchCompanies(page);
        total = count;
        if (!results.length)
            break;
        for (const company of results) {
            if ((company.name ?? '').toLowerCase().includes(wanted) || (company.short_name ?? '').toLowerCase().includes(wanted)) {
                hits.push({ company, page });
            }
        }
    }
    if (!hits.length)
        return `No company in the first ${pages} page(s) of ${total.toLocaleString()} matches "${args.name}". Raise pages to scan further.`;
    return [
        `Companies matching "${args.name}": ${hits.length} in ${pages} page(s) of the ${total.toLocaleString()} strong directory`,
        '',
        ...hits.slice(0, 20).map((hit) => `${companyLine(hit.company, 0)}   (page ${hit.page})`),
        hits.length > 20 ? `\nShowing 20 of ${hits.length}.` : '',
    ].filter((line) => line !== '').join('\n');
}
/** Open-role count for one company, straight from the jobs endpoint's total. */
async function rolesFor(company) {
    const params = new URLSearchParams({ page: '1', company });
    const res = await fetch(`${BASE}/jobs?${params.toString()}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new MuseError(`The Muse returned ${res.status} for company "${company}"`);
    const d = (await res.json());
    return d.total ?? 0;
}
/**
 * Open-role counts for several employers side by side, which is the question a
 * candidate asks when choosing between them.
 */
export async function compareCompanies(args) {
    const wanted = (args.companies ?? []).map((name) => String(name).trim()).filter(Boolean);
    if (wanted.length < 2)
        throw new MuseError("Give at least two companies to compare.");
    if (wanted.length > 5)
        throw new MuseError("Compare at most five companies at a time.");
    const counts = await Promise.all(wanted.map(async (name) => ({ name, roles: await rolesFor(name) })));
    const ranked = [...counts].sort((a, b) => b.roles - a.roles);
    const leader = ranked[0];
    const empty = counts.filter((row) => row.roles === 0).map((row) => row.name);
    return [
        'Open roles on The Muse',
        '',
        ...ranked.map((row, i) => `  ${i + 1}. ${row.name} — ${row.roles.toLocaleString()} role(s)`),
        '',
        leader.roles > 0 ? `${leader.name} is hiring the most, with ${leader.roles.toLocaleString()} open role(s).` : 'None of these companies has open roles listed.',
        empty.length ? `No listings found for: ${empty.join(', ')}. The Muse matches the company name in its own records, so try the exact spelling it uses.` : '',
    ].filter((line) => line !== '').join('\n');
}
// ---- muxG tools:
const TM_BASE = "https://www.themuse.com/api/public";
const TM_LIST_CAP = 12;
function tmBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
async function tmPages(pages) {
    const out = [];
    let meta = {};
    for (let p = 1; p <= pages; p += 1) {
        const res = await fetch(`${TM_BASE}/jobs?page=${p}`, {
            headers: { "User-Agent": "mrfentmen-themuse-mcp/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
        if (!res.ok)
            throw new MuseError(`The Muse public API returned ${res.status} for page ${p}.`);
        const d = (await res.json());
        if (p === 1)
            meta = d;
        const rows = d.results ?? [];
        if (!rows.length)
            break;
        out.push(...rows);
    }
    if (!out.length)
        throw new MuseError("The Muse public API returned no postings.");
    return { jobs: out, meta };
}
function tmRank(m, n) {
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}
/** Who is actually hiring in a slice, and how concentrated the market is. */
export async function marketConcentration(args) {
    const pages = tmBound(args?.pages, 1, 5, 2);
    const { jobs, meta } = await tmPages(pages);
    const companies = new Map();
    const levels = new Map();
    const locations = new Map();
    const categories = new Map();
    const withLevel = new Set();
    for (const j of jobs) {
        const c = j.company?.name ?? "not reported";
        companies.set(c, (companies.get(c) ?? 0) + 1);
        for (const l of j.levels ?? [])
            levels.set(l.name ?? "?", (levels.get(l.name ?? "?") ?? 0) + 1);
        for (const l of j.locations ?? [])
            locations.set(l.name ?? "?", (locations.get(l.name ?? "?") ?? 0) + 1);
        for (const cat of j.categories ?? [])
            categories.set(cat.name ?? "?", (categories.get(cat.name ?? "?") ?? 0) + 1);
        if ((j.levels ?? []).length)
            withLevel.add(j.company?.name ?? "?");
    }
    const ranked = [...companies.entries()].sort((a, b) => b[1] - a[1]);
    const top10 = ranked.slice(0, 10).reduce((s, [, n]) => s + n, 0);
    const topShare = jobs.length ? top10 / jobs.length : 0;
    const hhi = ranked.reduce((s, [, n]) => s + (n / jobs.length) ** 2, 0);
    const single = ranked[0];
    const multi = ranked.filter(([, n]) => n === 1).length;
    const remote = [...locations.keys()].filter((l) => new RegExp("remote", "i").test(l)).reduce((s, l) => s + (locations.get(l) ?? 0), 0);
    return [
        `Hiring concentration across ${jobs.length} listing(s) from ${pages} page(s) of the Muse public API`,
        `Distinct employers: ${companies.size} | distinct seniorities: ${levels.size} | distinct locations: ${locations.size} | distinct categories: ${categories.size}`,
        "",
        `Top 10 employers hold ${(topShare * 100).toFixed(0)}% of the listings`,
        `Herfindahl index over employers: ${hhi.toFixed(3)} (below 0.15 is unconcentrated, above 0.25 is dominated by a few)`,
        single ? `Largest single employer: ${single[0]} with ${single[1]} listing(s), ${((single[1] / jobs.length) * 100).toFixed(1)}% of the sample` : "",
        `${multi} employer(s) appear exactly once, which is most of them at this sample size`,
        remote ? `Listings at a location literally named "remote": ${remote} (${((remote / jobs.length) * 100).toFixed(0)}%)` : "",
        `${withLevel.size} of ${companies.size} employer(s) tag their listings with a seniority level`,
        "",
        "Top employers:",
        ...ranked.slice(0, TM_LIST_CAP).map(([c, n]) => `  ${String(n).padStart(4)}  ${c.slice(0, 60)}`),
        "",
        "Seniority levels present:",
        ...tmRank(levels, 8).map(([k, n]) => `  ${String(n).padStart(4)}  ${k}`),
        "",
        "Locations present:",
        ...tmRank(locations, 8).map(([k, n]) => `  ${String(n).padStart(4)}  ${k.slice(0, 50)}`),
        categories.size
            ? `Categories present: ${tmRank(categories, 6).map(([k, n]) => `${k} (${n})`).join(", ")}`
            : "Categories: this slice returned none, which usually means the field is only populated on some listings rather than that the roles are uncategorised.",
        "",
        `The API paginates through ${(meta.page_count ?? 0).toLocaleString("en-US")} pages in a fixed order, so the first pages are a biased sample of whatever the index orders first, not a random draw. Read these shares as the shape of that slice, not of the whole market.`,
    ]
        .filter(Boolean)
        .join("\n");
}
