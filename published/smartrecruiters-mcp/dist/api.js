const UA = 'mrfentmen-smartrecruiters-mcp/1.0';
const BASE = 'https://api.smartrecruiters.com/v1/companies';
const SEARCH = 'https://jobs.smartrecruiters.com/sr-jobs/search';
const clamp = (value, fallback, max) => Math.min(Math.max(Number(value ?? fallback) || fallback, 0), max);
const companyId = (company) => {
    const value = String(company ?? '').trim();
    if (!value)
        throw new Error('Provide a company id, for example BoschGroup.');
    return encodeURIComponent(value);
};
const plain = (html) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const place = (location) => location?.fullLocation ?? [location?.city, location?.region, location?.country].filter(Boolean).join(', ') ?? '?';
const row = (posting, index) => `${index + 1}. ${posting.name ?? '?'} | ${place(posting.location)}${posting.location?.remote ? ' (remote)' : ''}` +
    ` | ${posting.department?.label ?? '?'} | ${posting.employmentType ?? posting.typeOfEmployment?.label ?? '?'}` +
    ` | released ${String(posting.releasedDate ?? '?').slice(0, 10)}\n   id: ${posting.id ?? '?'}`;
const hitRow = (hit, index) => `${index + 1}. ${hit.name ?? '?'} | ${hit.company?.name ?? '?'} | ${hit.shortLocation ?? place(hit.location)}` +
    `${hit.location?.remote ? ' (remote)' : ''} | released ${String(hit.releasedDate ?? '?').slice(0, 10)}` +
    `\n   apply: ${hit.applyUrl ?? '?'}`;
async function fetchPostings(company, limit = 100, query) {
    const q = query ? `&q=${encodeURIComponent(query)}` : '';
    const res = await fetch(`${BASE}/${companyId(company)}/postings?limit=${clamp(limit, 100, 100)}&offset=0${q}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`SmartRecruiters returned ${res.status}`);
    const d = (await res.json());
    const rows = d.content ?? [];
    return { total: d.totalFound ?? rows.length, rows };
}
/**
 * SmartRecruiters' public cross-company search returns one fixed page of its top
 * matches and ignores limit/offset/page, so paging is not possible here.
 */
async function fetchSearch(keyword) {
    const res = await fetch(`${SEARCH}?keyword=${encodeURIComponent(keyword)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`SmartRecruiters search returned ${res.status}`);
    const d = (await res.json());
    const hits = d.content ?? [];
    return { total: d.totalFound ?? hits.length, hits };
}
const REGION_ALIASES = {
    uk: 'gb', 'great britain': 'gb', britain: 'gb', england: 'gb', scotland: 'gb', wales: 'gb',
    usa: 'us', 'united states of america': 'us', america: 'us',
    uae: 'ae', korea: 'kr', 'south korea': 'kr', 'north korea': 'kp', russia: 'ru',
    holland: 'nl', czechia: 'cz', 'czech republic': 'cz', turkey: 'tr', turkiye: 'tr', taiwan: 'tw',
};
const regionNames = (() => {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' });
    }
    catch {
        return undefined;
    }
})();
/** Turn a two letter country code into its English name, e.g. 'us' -> 'united states'. */
const regionName = (code) => {
    const value = String(code ?? '').trim().toUpperCase();
    if (value.length !== 2)
        return '';
    try {
        return String(regionNames?.of(value) ?? '').toLowerCase();
    }
    catch {
        return '';
    }
};
const matchesCountry = (hit, input) => {
    const wanted = input.trim().toLowerCase();
    if (!wanted)
        return true;
    const code = REGION_ALIASES[wanted] ?? wanted;
    const rowCode = String(hit.location?.country ?? '').toLowerCase();
    if (rowCode && rowCode === code)
        return true;
    const name = regionName(rowCode);
    return !!name && (name === wanted || name.includes(wanted) || wanted.includes(name));
};
/**
 * The upstream search ranks by recency, not relevance, so jobs whose title really
 * matches the keywords are pushed to the top here.
 */
const rankHits = (hits, keyword) => {
    const words = keyword.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 1);
    const score = (hit) => {
        const name = String(hit.name ?? '').toLowerCase();
        return words.reduce((total, word) => total + (name.includes(word) ? 1 : 0), 0);
    };
    return hits
        .map((hit, index) => ({ hit, index, score: score(hit) }))
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((entry) => entry.hit);
};
export async function jobs(args) {
    const { total, rows } = await fetchPostings(args?.company, 100);
    if (!rows.length)
        return `No SmartRecruiters postings for "${args.company}".`;
    const offset = clamp(args?.offset, 0, rows.length);
    const limit = clamp(args?.limit, 10, 50);
    const slice = rows.slice(offset, offset + limit);
    return `SmartRecruiters postings for "${args.company}" (${total} total, showing ${slice.length} from offset ${offset}):\n` +
        slice.map(row).join('\n');
}
export async function posting(args) {
    const id = String(args?.posting_id ?? '').trim();
    if (!id)
        throw new Error('posting_id is required.');
    const res = await fetch(`${BASE}/${companyId(args.company)}/postings/${encodeURIComponent(id)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`SmartRecruiters returned ${res.status}`);
    const found = (await res.json());
    const sections = found.jobAd?.sections ?? {};
    const body = Object.values(sections)
        .map((section) => plain(section?.text))
        .filter(Boolean)
        .join('\n\n');
    return `${found.name ?? '?'}\n` +
        `Location: ${place(found.location)}${found.location?.remote ? ' (remote)' : ''}\n` +
        `Department: ${found.department?.label ?? '?'} | Function: ${found.function?.label ?? '?'}\n` +
        `Employment: ${found.typeOfEmployment?.label ?? found.employmentType ?? '?'} | Experience: ${found.experienceLevel?.label ?? '?'}\n` +
        `Released: ${String(found.releasedDate ?? '?').slice(0, 10)} | Ref: ${found.refNumber ?? '?'}\n` +
        `Apply: ${found.applyUrl ?? '?'}\n\n` +
        body.slice(0, 4000);
}
export async function searchPostings(args) {
    const query = String(args?.query ?? '').trim();
    if (!query)
        throw new Error('query is required.');
    const limit = clamp(args?.limit, 10, 50);
    const { total, rows } = await fetchPostings(args?.company, 50, query);
    if (!rows.length)
        return `No postings for "${args.company}" match "${query}" (${total} postings on the board).`;
    return `SmartRecruiters postings at "${args.company}" matching "${query}" (${total} match on the board, showing ${Math.min(limit, rows.length)}):\n` +
        rows.slice(0, limit).map(row).join('\n');
}
export async function departments(args) {
    const { total, rows } = await fetchPostings(args?.company, 100);
    if (!rows.length)
        return `No SmartRecruiters postings for "${args.company}".`;
    const count = (pick) => {
        const counts = new Map();
        for (const entry of rows) {
            const key = pick(entry);
            if (key)
                counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    };
    const block = (title, entries) => entries.length
        ? `${title}:\n` + entries.map(([name, n], i) => `  ${i + 1}. ${name} - ${n} job(s)`).join('\n')
        : '';
    const blocks = [
        block('Departments', count((p) => p.department?.label)),
        block('Functions', count((p) => p.function?.label)),
        block('Industries', count((p) => p.industry?.label)),
        block('Experience levels', count((p) => p.experienceLevel?.label)),
    ].filter(Boolean);
    return `SmartRecruiters hiring breakdown for "${args.company}" (${rows.length} of ${total} postings scanned):\n` +
        blocks.join('\n');
}
export async function searchAllJobs(args) {
    const keyword = String(args?.keyword ?? '').trim();
    if (!keyword)
        throw new Error('keyword is required, for example python developer.');
    const country = String(args?.country ?? '').trim();
    const limit = clamp(args?.limit, 10, 40);
    const { total, hits } = await fetchSearch(keyword);
    let matched = rankHits(hits, keyword);
    const notes = [];
    if (country) {
        matched = matched.filter((hit) => matchesCountry(hit, country));
        notes.push(`filtered to "${country}"`);
    }
    if (args?.remote === true) {
        matched = matched.filter((hit) => hit.location?.remote);
        notes.push('remote only');
    }
    const scope = notes.length ? ` (${notes.join(', ')})` : '';
    if (!matched.length) {
        const hint = country ? ` Check the country spelling (use a name like "Germany" or a code like "DE").` : '';
        return `No SmartRecruiters jobs for "${keyword}"${scope} among the ${hits.length} top matches (${total} jobs match upstream).${hint}`;
    }
    return `SmartRecruiters jobs for "${keyword}" across all companies${scope} - ` +
        `${matched.length} of the top ${hits.length} matches, ${total} jobs match upstream, best title matches first:\n` +
        matched.slice(0, limit).map(hitRow).join('\n') +
        `\nSmartRecruiters returns a single 99 job page and ignores paging, so older matches are not reachable.`;
}
export async function hiringCompanies(args) {
    const keyword = String(args?.keyword ?? '').trim();
    if (!keyword)
        throw new Error('keyword is required, for example data engineer.');
    const country = String(args?.country ?? '').trim();
    const limit = clamp(args?.limit, 5, 25);
    const { total, hits } = await fetchSearch(keyword);
    const scope = country ? ` in "${country}"` : '';
    const pool = rankHits(hits, keyword).filter((hit) => matchesCountry(hit, country));
    if (!pool.length) {
        const hint = country ? ` Check the country spelling (use a name like "Germany" or a code like "DE").` : '';
        return `No SmartRecruiters companies hiring for "${keyword}"${scope} among the ${hits.length} top matches (${total} jobs match upstream).${hint}`;
    }
    const groups = new Map();
    for (const hit of pool) {
        const key = hit.company?.identifier ?? hit.company?.name ?? '?';
        const group = groups.get(key) ?? { name: hit.company?.name ?? key, jobs: [] };
        group.jobs.push(hit);
        groups.set(key, group);
    }
    const ranked = [...groups.values()].sort((a, b) => b.jobs.length - a.jobs.length).slice(0, limit);
    return `Companies hiring for "${keyword}"${scope} on SmartRecruiters ` +
        `(${groups.size} companies across the top ${pool.length} matches, ${total} jobs match upstream):\n` +
        ranked
            .map((group, i) => {
            const sample = group.jobs[0];
            return `  ${i + 1}. ${group.name} - ${group.jobs.length} job(s), e.g. ` +
                `${sample?.name ?? '?'} (${sample?.shortLocation ?? place(sample?.location)})`;
        })
            .join('\n');
}
// ---- batch-5 tools: deep paging, country filter, board overview (2026-09-27) ----
/**
 * The postings endpoint pages with offset, and every earlier tool reads offset 0,
 * so large boards (BoschGroup lists thousands) were only ever seen from the top.
 * It also filters by country server-side.
 */
async function fetchPostingPage(company, offset, limit, country) {
    const countryParam = country ? `&country=${encodeURIComponent(country.toLowerCase())}` : '';
    const url = `${BASE}/${companyId(company)}/postings?limit=${clamp(limit, 100, 100)}&offset=${Math.max(offset, 0)}${countryParam}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`SmartRecruiters returned ${res.status}`);
    const d = (await res.json());
    const rows = d.content ?? [];
    return { total: d.totalFound ?? rows.length, rows };
}
/** Page deeper into a board than the first hundred postings. */
export async function postingsPage(args) {
    const offset = Math.max(Math.trunc(args.offset ?? 0), 0);
    const limit = clamp(args.limit, 25, 100);
    const { total, rows } = await fetchPostingPage(args.company, offset, limit);
    if (!rows.length) {
        return total
            ? `No postings at offset ${offset}: ${companyId(args.company)} lists ${total.toLocaleString()} in total, so the offset is past the end.`
            : `${companyId(args.company)} has no public postings.`;
    }
    return [
        `${companyId(args.company)} postings ${offset + 1}-${offset + rows.length} of ${total.toLocaleString()}`,
        "",
        ...rows.map((posting, i) => row(posting, offset + i)),
        offset + rows.length < total ? `\nNext page: postings_page with offset ${offset + rows.length}.` : "",
    ].filter((line) => line !== "").join("\n");
}
/**
 * One country's postings, filtered by the API itself rather than by reading
 * every page and discarding the rest.
 */
export async function postingsByCountry(args) {
    const country = (args.country ?? '').trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(country))
        throw new Error("Give a two-letter country code, e.g. 'fr', 'us', 'de'.");
    const limit = clamp(args.limit, 25, 100);
    const { total, rows } = await fetchPostingPage(args.company, 0, limit, country);
    const whole = await fetchPostingPage(args.company, 0, 1);
    if (!rows.length)
        return `No public posting for ${companyId(args.company)} is in ${country.toUpperCase()}.`;
    const share = whole.total ? Math.round((total / whole.total) * 100) : 0;
    const hybrid = rows.filter((posting) => posting.location?.remote).length;
    return [
        `${companyId(args.company)} in ${country.toUpperCase()}: ${total.toLocaleString()} of ${whole.total.toLocaleString()} posting(s) (${share}%)`,
        hybrid ? `  ${hybrid} of the ${rows.length} shown are flagged remote` : "  none of the ones shown are flagged remote",
        "",
        ...rows.map((posting, i) => row(posting, i)),
        total > rows.length ? `\nShowing ${rows.length} of ${total.toLocaleString()}; raise limit (max 100) or use postings_page with the country offset.` : "",
    ].filter((line) => line !== "").join("\n");
}
/**
 * A board as a whole: how many postings, which countries and departments they
 * sit in, the mix of experience levels and how much of it is remote.
 */
export async function boardOverview(args) {
    const { total, rows } = await fetchPostingPage(args.company, 0, 100);
    if (!rows.length)
        return `${companyId(args.company)} has no public postings.`;
    const tally = (values) => {
        const counts = new Map();
        for (const value of values)
            if (value)
                counts.set(value, (counts.get(value) ?? 0) + 1);
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    };
    const countries = tally(rows.map((posting) => (posting.location?.country ?? '').toUpperCase()));
    const departments = tally(rows.map((posting) => posting.department?.label ?? ''));
    const levels = tally(rows.map((posting) => posting.experienceLevel?.label ?? ''));
    const types = tally(rows.map((posting) => posting.employmentType ?? posting.typeOfEmployment?.label ?? ''));
    const remote = rows.filter((posting) => posting.location?.remote).length;
    const dates = rows.map((posting) => String(posting.releasedDate ?? '').slice(0, 10)).filter(Boolean).sort();
    const block = (label, entries) => entries.length ? `${label}:\n${entries.slice(0, 6).map(([key, n]) => `  ${key} — ${n}`).join('\n')}` : '';
    return [
        `${companyId(args.company)} board: ${total.toLocaleString()} posting(s), analysed ${rows.length}`,
        dates.length ? `  released between ${dates[0]} and ${dates[dates.length - 1]}` : '',
        `  remote: ${remote} of ${rows.length} (${Math.round((remote / rows.length) * 100)}%)`,
        '',
        block('Countries', countries),
        block('Departments', departments),
        block('Experience levels', levels),
        block('Contract types', types),
        total > rows.length ? `\nThe picture covers the newest ${rows.length} of ${total.toLocaleString()}; use postings_page to sample further in.` : '',
    ].filter((line) => line !== '').join('\n');
}
// ---- muxH tools:
// board_overview tallies the newest hundred postings by country and department.
// These two ask different questions of the whole board: how old the adverts
// still standing are, and how far apart on the map the jobs actually are.
const SR_UA = 'mrfentmen-smartrecruiters-mcp/1.1 (https://github.com/mcfentmen/smartrecruiters-mcp)';
const SR_MAX = 100;
/** One page of a company's postings, with the board's own total. */
async function srPage(company, offset) {
    const res = await fetch(`${BASE}/${companyId(company)}/postings?limit=${SR_MAX}&offset=${offset}`, {
        headers: { 'User-Agent': SR_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`SmartRecruiters returned ${res.status}`);
    const d = (await res.json());
    return { total: d.totalFound ?? (d.content?.length ?? 0), rows: d.content ?? [] };
}
/**
 * The postings endpoint sorts newest first, so reading the first pages only ever
 * describes this week's adverts. This samples pages spread evenly across the whole
 * board instead, so an age or geography profile is drawn from the entire posting list.
 */
async function srSample(company, pages) {
    const first = await srPage(company, 0);
    if (!first.rows.length)
        return { ...first, rows: [], truncated: false };
    const pageCount = Math.max(1, Math.ceil(first.total / SR_MAX));
    const wanted = Math.min(pages, pageCount);
    const offsets = [];
    for (let i = 0; i < wanted; i += 1) {
        offsets.push(Math.round((i * (pageCount - 1)) / Math.max(1, wanted - 1)) * SR_MAX);
    }
    const all = [];
    for (const offset of [...new Set(offsets)]) {
        const page = offset === 0 ? first : await srPage(company, offset);
        if (page.rows.length)
            all.push(...page.rows);
    }
    return { total: first.total, rows: all, truncated: all.length < first.total };
}
const daysSince = (iso) => {
    const t = Date.parse(String(iso ?? ''));
    return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86400000) : null;
};
const BUCKETS = [
    ['under 30 days', 30],
    ['30 to 90 days', 90],
    ['90 to 180 days', 180],
    ['180 to 365 days', 365],
    ['over a year', null],
];
/**
 * How long the adverts on a board have actually been standing. A board of 5,000
 * postings where the median is a year old is a different situation from one where
 * the median is a fortnight, and no amount of listing reveals that.
 */
export async function postingAge(args) {
    const pages = Math.min(Math.max(Math.trunc(args.pages ?? 6) || 6, 1), 20);
    const { total, rows, truncated } = await srSample(args.company, pages);
    if (!rows.length)
        return `${companyId(args.company)} has no public postings.`;
    const ages = rows
        .map((posting) => daysSince(posting.releasedDate))
        .filter((n) => n !== null)
        .sort((a, b) => a - b);
    if (!ages.length) {
        return `${companyId(args.company)} lists ${total.toLocaleString()} posting(s), but none of the ${rows.length} sampled declare a releasedDate, so no age can be computed.`;
    }
    const median = ages.length % 2 ? ages[(ages.length - 1) / 2] : (ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2;
    const counts = new Array(BUCKETS.length).fill(0);
    for (const age of ages) {
        const index = BUCKETS.findIndex(([, ceiling]) => ceiling === null || age <= ceiling);
        counts[index === -1 ? BUCKETS.length - 1 : index] += 1;
    }
    const maxCount = Math.max(...counts);
    const stale = counts[3] + counts[4];
    const perMonth = new Map();
    for (const posting of rows) {
        const month = String(posting.releasedDate ?? '').slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(month))
            perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
    }
    const months = [...perMonth.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 8);
    const oldest = rows
        .map((posting) => ({ posting, age: daysSince(posting.releasedDate) }))
        .filter((e) => e.age !== null)
        .sort((a, b) => b.age - a.age);
    return [
        `${companyId(args.company)} posting age: ${rows.length} of ${total.toLocaleString()} posting(s) sampled`,
        `  age in days — newest ${ages[0]}, median ${median}, p90 ${ages[Math.floor(ages.length * 0.9)]}, oldest ${ages[ages.length - 1]}`,
        '',
        'Age buckets:',
        ...BUCKETS.map(([label], i) => {
            const bar = '#'.repeat(Math.max(0, Math.round((counts[i] / maxCount) * 32)));
            return `  ${label.padEnd(16)}${String(counts[i]).padStart(5)}  ${((counts[i] / rows.length) * 100).toFixed(0).padStart(3)}%  ${bar}`;
        }),
        `  ${stale} of ${rows.length} (${((stale / rows.length) * 100).toFixed(0)}%) have been standing more than half a year.`,
        '',
        months.length ? `Newest months of release (of those sampled):\n${months.map(([m, n]) => `  ${m}  ${'#'.repeat(Math.round((n / (months[0]?.[1] || 1)) * 24))} ${n}`).join('\n')}` : '',
        '',
        'Longest-standing adverts still listed:',
        ...oldest.slice(0, 6).map((entry, i) => `  ${i + 1}. ${entry.age} days — ${entry.posting.name?.slice(0, 60) ?? '?'} | ${place(entry.posting.location)} | id ${entry.posting.id ?? '?'}`),
        truncated
            ? `\nSampled ${rows.length} of ${total.toLocaleString()}, spread evenly across the board; raise pages (max 20) to widen it, or use postings_page to step through the rest.`
            : '\nThe whole board was sampled.',
        '',
        "Age is measured from releasedDate to now, so it is how long the advert has been published, not how long the role has been open or how long it is expected to stay. The board lists newest first, so the sample is taken at offsets spread across the whole list rather than from the top.",
    ].filter((line) => line !== '').join('\n');
}
/**
 * Where a board's jobs actually sit on the map: the cities that carry the hiring,
 * how many countries they span, how remote the work is, and how concentrated the
 * board is in its single busiest city.
 */
export async function locationSpread(args) {
    const pages = Math.min(Math.max(Math.trunc(args.pages ?? 6) || 6, 1), 20);
    const limit = Math.min(Math.max(Math.trunc(args.limit ?? 12) || 12, 1), 30);
    const { total, rows, truncated } = await srSample(args.company, pages);
    if (!rows.length)
        return `${companyId(args.company)} has no public postings.`;
    const cities = new Map();
    let remote = 0;
    let hybrid = 0;
    let located = 0;
    let withCoords = 0;
    for (const posting of rows) {
        const loc = posting.location;
        if (loc?.remote)
            remote += 1;
        if (loc?.hybrid)
            hybrid += 1;
        const city = String(loc?.city ?? '').trim();
        const country = String(loc?.country ?? '').toUpperCase();
        if (!city && !country)
            continue;
        located += 1;
        const key = `${city}|${country}`;
        const entry = cities.get(key) ?? { name: city || 'city not reported', country: country || '??', count: 0, remote: 0, lats: [], lons: [] };
        entry.count += 1;
        if (loc?.remote)
            entry.remote += 1;
        const lat = Number(loc?.latitude);
        const lon = Number(loc?.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
            entry.lats.push(lat);
            entry.lons.push(lon);
            withCoords += 1;
        }
        cities.set(key, entry);
    }
    if (!located) {
        return `${companyId(args.company)} lists ${total.toLocaleString()} posting(s), but none of the ${rows.length} sampled carry a city or country, so no geographic spread can be computed.`;
    }
    const ranked = [...cities.values()].sort((a, b) => b.count - a.count);
    const countries = new Map();
    for (const city of cities.values())
        countries.set(city.country, (countries.get(city.country) ?? 0) + city.count);
    const top = ranked[0]?.count ?? 1;
    const centre = (lats, lons) => {
        if (!lats.length)
            return 'no coordinates published';
        const lat = lats.reduce((a, b) => a + b, 0) / lats.length;
        const lon = lons.reduce((a, b) => a + b, 0) / lons.length;
        return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
    };
    const allLats = ranked.flatMap((c) => c.lats);
    const allLons = ranked.flatMap((c) => c.lons);
    return [
        `${companyId(args.company)} location spread: ${rows.length} of ${total.toLocaleString()} posting(s) sampled`,
        `  ${located} carry a location | ${cities.size} distinct city/country pair(s) across ${countries.size} countr${countries.size === 1 ? 'y' : 'ies'}`,
        `  remote ${remote} (${((remote / rows.length) * 100).toFixed(0)}%) | hybrid ${hybrid} (${((hybrid / rows.length) * 100).toFixed(0)}%) | ${withCoords} publish coordinates`,
        `  centre of mass of published coordinates: ${centre(allLats, allLons)}`,
        `  busiest city carries ${((top / located) * 100).toFixed(0)}% of located postings, so the board is ${top / located > 0.5 ? 'highly concentrated' : top / located > 0.25 ? 'moderately concentrated' : 'widely spread'}`,
        '',
        'Busiest locations:',
        ...ranked.slice(0, limit).map((city, i) => `  ${String(i + 1).padStart(2)}. ${city.name}, ${city.country}  ${String(city.count).padStart(4)} posting(s)` +
            `  ${((city.count / located) * 100).toFixed(0).padStart(3)}%  ${city.remote ? `${city.remote} remote` : 'none remote'}  ${centre(city.lats, city.lons)}` +
            `  ${'#'.repeat(Math.max(1, Math.round((city.count / top) * 20)))}`),
        ranked.length > limit ? `  (+${ranked.length - limit} further location(s) not shown)` : '',
        '',
        'Countries:',
        ...[...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, n]) => `  ${code}  ${String(n).padStart(5)}  ${'#'.repeat(Math.max(1, Math.round((n / (countries.size ? Math.max(...countries.values()) : 1)) * 20)))}`),
        truncated ? `\nSampled ${rows.length} of ${total.toLocaleString()}, spread evenly across the board; raise pages (max 20) to widen it.` : '\nThe whole board was sampled.',
        '',
        'Remote and hybrid come from the flags the employer published per posting, and the centre of mass is the mean of those same coordinates, which sits in ocean or empty country whenever a board has two far-flung hubs.',
    ].filter((line) => line !== '').join('\n');
}
