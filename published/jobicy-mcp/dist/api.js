const UA = 'mrfentmen-jobicy-mcp/1.0';
const BASE = 'https://jobicy.com/api/v2/remote-jobs';
const clamp = (value, fallback) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), 50);
async function fetchJobs(args) {
    const params = new URLSearchParams({ count: String(clamp(args?.count, 5)) });
    for (const key of ['geo', 'industry', 'tag']) {
        const value = args?.[key];
        if (value && String(value).trim())
            params.set(key, String(value).trim());
    }
    const res = await fetch(`${BASE}?${params}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Jobicy returned ${res.status}`);
    const d = (await res.json());
    if (d.error)
        throw new Error(`Jobicy: ${d.error}`);
    return d.jobs ?? [];
}
const money = (value) => (value == null ? '?' : `$${Math.round(value).toLocaleString('en-US')}`);
const salary = (job) => {
    if (job.salaryMin == null && job.salaryMax == null)
        return 'salary not published';
    return `${money(job.salaryMin)}-${money(job.salaryMax)} ${job.salaryCurrency ?? 'USD'} ${job.salaryPeriod ?? ''}`.trim();
};
const ANNUAL_FACTOR = {
    yearly: 1, annually: 1, year: 1, monthly: 12, month: 12, weekly: 52, week: 52,
    biweekly: 26, daily: 260, day: 260, hourly: 2080, hour: 2080,
};
const annualMax = (job) => {
    const factor = ANNUAL_FACTOR[String(job.salaryPeriod ?? '').toLowerCase()];
    const top = job.salaryMax ?? job.salaryMin;
    if (!factor || top == null)
        return null;
    return top * factor;
};
const row = (job, index) => `${index + 1}. ${job.jobTitle ?? '?'} at ${job.companyName ?? '?'}\n` +
    `   ${job.jobGeo ?? 'remote'} | ${job.jobLevel ?? 'any level'} | ` +
    `${(job.jobIndustry ?? []).join(', ') || 'industry n/a'} | ${(job.jobType ?? []).join(', ') || 'type n/a'}\n` +
    `   ${salary(job)} | posted ${String(job.pubDate ?? '?').slice(0, 10)}\n` +
    `   ${job.url ?? ''}`;
export async function jobs(args) {
    const list = await fetchJobs(args ?? {});
    if (!list.length)
        return 'No Jobicy jobs matched those filters.';
    return `Jobicy remote jobs (${list.length}):\n` + list.map(row).join('\n\n');
}
export async function jobDetails(args) {
    const query = String(args?.query ?? '').trim().toLowerCase();
    if (!query)
        throw new Error('query is required');
    const list = await fetchJobs({ count: 50, geo: args?.geo });
    const hits = list.filter((job) => `${job.jobTitle ?? ''} ${job.companyName ?? ''} ${(job.jobIndustry ?? []).join(' ')} ${job.jobExcerpt ?? ''}`
        .toLowerCase()
        .includes(query));
    if (!hits.length) {
        return `None of the ${list.length} most recent Jobicy jobs match "${args.query}". Try the jobs tool with a tag or industry filter.`;
    }
    return `Jobicy jobs matching "${args.query}" (${hits.length} of the ${list.length} most recent):\n\n` +
        hits.map((job, i) => `${row(job, i)}\n   ---\n   ${String(job.jobDescription ?? job.jobExcerpt ?? 'no description').replace(/\s+/g, ' ').slice(0, 1200)}`).join('\n\n');
}
export async function industries(args) {
    const list = await fetchJobs({ count: 50, geo: args?.geo });
    const counts = new Map();
    for (const job of list) {
        for (const industry of job.jobIndustry ?? []) {
            counts.set(industry, (counts.get(industry) ?? 0) + 1);
        }
    }
    if (!counts.size)
        return 'No Jobicy industries returned.';
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const scope = args?.geo ? ` for ${args.geo}` : '';
    return `Jobicy industries by open remote jobs${scope} (from the ${list.length} most recent postings):\n` +
        ranked.map(([industry, count], i) => `${i + 1}. ${industry} - ${count} job(s)`).join('\n');
}
export async function topSalaries(args) {
    const limit = clamp(args?.count, 10);
    const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
    const ranked = list
        .map((job) => ({ job, annual: annualMax(job) }))
        .filter((entry) => entry.annual != null)
        .sort((a, b) => b.annual - a.annual)
        .slice(0, limit);
    if (!ranked.length)
        return 'No Jobicy jobs in the most recent 50 publish a salary.';
    return `Highest-paying Jobicy remote jobs (annualized, from the ${list.length} most recent postings):\n\n` +
        ranked.map((entry, i) => `${i + 1}. ${entry.job.jobTitle ?? '?'} at ${entry.job.companyName ?? '?'} - ${money(entry.annual)}/year\n` +
            `   published as ${salary(entry.job)} | ${entry.job.jobGeo ?? 'remote'} | posted ${String(entry.job.pubDate ?? '?').slice(0, 10)}\n` +
            `   ${entry.job.url ?? ''}`).join('\n\n');
}
export async function companies(args) {
    const limit = clamp(args?.count, 10);
    const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
    if (!list.length)
        return 'No Jobicy jobs matched those filters.';
    const groups = new Map();
    for (const job of list) {
        const name = String(job.companyName ?? '').trim();
        if (!name)
            continue;
        const group = groups.get(name) ?? { jobs: 0, latest: '', pays: 0 };
        group.jobs += 1;
        const posted = String(job.pubDate ?? '').slice(0, 10);
        if (posted > group.latest)
            group.latest = posted;
        const annual = annualMax(job);
        if (annual != null) {
            group.pays += 1;
            group.top = Math.max(group.top ?? 0, annual);
        }
        groups.set(name, group);
    }
    if (!groups.size)
        return 'No Jobicy postings in the most recent feed named a company.';
    const ranked = [...groups.entries()].sort((a, b) => b[1].jobs - a[1].jobs).slice(0, limit);
    const scope = [args?.geo, args?.industry, args?.tag].filter(Boolean).join(', ');
    return `Companies hiring most on Jobicy${scope ? ` (${scope})` : ''} — from the ${list.length} most recent postings, ${groups.size} companies:\n` +
        ranked
            .map(([name, group], i) => {
            const pay = group.top ? `, top published pay ${money(group.top)}/year` : '';
            const disclosed = group.pays ? `, ${group.pays} disclosed pay` : '';
            return `${i + 1}. ${name} - ${group.jobs} job(s)${disclosed}${pay}, newest ${group.latest || '?'}`;
        })
            .join('\n');
}
export async function jobLevels(args) {
    const list = await fetchJobs({ count: 50, geo: args?.geo });
    if (!list.length)
        return 'No Jobicy jobs matched those filters.';
    const tally = (pick) => {
        const counts = new Map();
        for (const job of list) {
            for (const value of pick(job)) {
                const typed = String(value ?? '').trim().toLowerCase();
                if (typed)
                    counts.set(typed, (counts.get(typed) ?? 0) + 1);
            }
        }
        return [...counts.entries()].sort((a, b) => b[1] - a[1]);
    };
    const levels = tally((job) => [String(job.jobLevel ?? '')]);
    const types = tally((job) => job.jobType ?? []);
    const block = (title, rows) => rows.length ? `${title}:\n` + rows.map(([name, n], i) => `  ${i + 1}. ${name} - ${n} job(s)`).join('\n') : '';
    // Salary per level is only meaningful for the jobs that published one.
    const payByLevel = new Map();
    for (const job of list) {
        const annual = annualMax(job);
        if (annual == null)
            continue;
        const level = String(job.jobLevel ?? 'unspecified').trim().toLowerCase();
        payByLevel.set(level, [...(payByLevel.get(level) ?? []), annual]);
    }
    const payLines = [...payByLevel.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .map(([level, values]) => {
        const top = Math.max(...values);
        return `  ${level}: ${values.length} job(s) with pay, highest ${money(top)}/year`;
    });
    const scope = args?.geo ? ` for ${args.geo}` : '';
    const blocks = [
        block('Experience levels', levels),
        block('Employment types', types),
        payLines.length ? `Published pay by level:\n${payLines.join('\n')}` : '',
    ].filter(Boolean);
    return `Jobicy remote hiring breakdown${scope} (from the ${list.length} most recent postings):\n` + blocks.join('\n');
}
/** Live breakdown of where the open remote jobs are based (jobGeo). */
export async function geographies(args) {
    const list = await fetchJobs({ count: 50, industry: args?.industry, tag: args?.tag });
    if (!list.length)
        return 'No Jobicy jobs matched those filters.';
    const counts = new Map();
    for (const job of list) {
        // Upstream geo strings sometimes carry double spaces between countries.
        const key = String(job.jobGeo ?? '').replace(/\s+/g, ' ').trim() || 'not stated';
        const group = counts.get(key) ?? { jobs: 0 };
        group.jobs += 1;
        const annual = annualMax(job);
        if (annual != null)
            group.top = Math.max(group.top ?? 0, annual);
        counts.set(key, group);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1].jobs - a[1].jobs);
    const scope = [args?.industry, args?.tag].filter(Boolean).join(', ');
    return `Where Jobicy remote jobs are based${scope ? ` (${scope})` : ''} — from the ${list.length} most recent postings, ${ranked.length} place(s):\n` +
        ranked.map(([place, group], i) => `${i + 1}. ${place} - ${group.jobs} job(s)${group.top ? `, top published pay ${money(group.top)}/year` : ''}`).join('\n');
}
/** Every open role from one company in the most recent Jobicy postings. */
export async function companyJobs(args) {
    const needle = String(args?.company ?? '').trim().toLowerCase();
    if (!needle)
        throw new Error('company is required.');
    const limit = clamp(args?.count, 20);
    const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
    const hits = list
        .filter((job) => String(job.companyName ?? '').toLowerCase().includes(needle))
        .sort((a, b) => String(b.pubDate ?? '').localeCompare(String(a.pubDate ?? '')));
    if (!hits.length) {
        return `No Jobicy postings from a company matching "${args.company}" among the ${list.length} most recent jobs. Use the companies tool for exact names.`;
    }
    const names = [...new Set(hits.map((job) => String(job.companyName ?? '?')))];
    return `Jobicy jobs at ${names.join(', ')} (${hits.length} of ${list.length} most recent):\n\n` +
        hits.slice(0, limit).map((job, i) => `${row(job, i)}\n   ---\n   ${String(job.jobExcerpt ?? job.jobDescription ?? 'no summary published').replace(/\s+/g, ' ').slice(0, 400)}`).join('\n\n');
}
const PAY_BANDS = [
    { label: 'under $50k', upTo: 50000 },
    { label: '$50k-$80k', upTo: 80000 },
    { label: '$80k-$120k', upTo: 120000 },
    { label: '$120k-$200k', upTo: 200000 },
    { label: '$200k+', upTo: Number.POSITIVE_INFINITY },
];
/** Published-pay distribution across the most recent Jobicy postings. */
export async function salaryBands(args) {
    const list = await fetchJobs({ count: 50, geo: args?.geo, industry: args?.industry, tag: args?.tag });
    const annual = list
        .map((job) => annualMax(job))
        .filter((value) => value != null)
        .sort((a, b) => a - b);
    if (!annual.length) {
        return `None of the ${list.length} most recent Jobicy postings publish a salary range.`;
    }
    const middle = Math.floor(annual.length / 2);
    const median = annual.length % 2 ? annual[middle] : (annual[middle - 1] + annual[middle]) / 2;
    const disclosure = Math.round((annual.length / list.length) * 100);
    const bands = PAY_BANDS.map((band, index) => {
        const floor = index === 0 ? 0 : PAY_BANDS[index - 1].upTo;
        const members = annual.filter((value) => value >= floor && value < band.upTo);
        const share = Math.round((members.length / annual.length) * 100);
        return `${band.label}: ${members.length} job(s) (${share}%)`;
    });
    const scope = [args?.geo, args?.industry, args?.tag].filter(Boolean).join(', ');
    return `Published pay on Jobicy${scope ? ` (${scope})` : ''} — ${annual.length} of ${list.length} most recent postings disclose a salary (${disclosure}%):\n` +
        `Median ${money(median)}/year | lowest ${money(annual[0])} | highest ${money(annual[annual.length - 1])}\n` +
        `Bands (annualized):\n` +
        bands.map((line) => `  ${line}`).join('\n') +
        `\nOnly jobs that published a range are counted; the rest are silent about pay.`;
}
// ---- muxG tools:
const JOBICY_MAX = 50;
async function jobicyEnvelope(args) {
    const params = new URLSearchParams({ count: String(clamp(args?.count, 5)) });
    for (const key of ['geo', 'industry', 'tag']) {
        const value = args?.[key];
        if (value && String(value).trim())
            params.set(key, String(value).trim());
    }
    const res = await fetch(`${BASE}?${params}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Jobicy returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new Error('Jobicy returned an empty body.');
    const data = JSON.parse(text);
    if (data.error)
        throw new Error(`Jobicy: ${data.error}`);
    return data;
}
const jobicyAge = (iso) => {
    if (typeof iso !== 'string')
        return null;
    const at = Date.parse(iso);
    if (!Number.isFinite(at))
        return null;
    return Math.round((Date.now() - at) / 3_600_000);
};
/** How the Jobicy feed itself is doing: version, last update, match count and the filters it applied. */
export async function feedStatus(args) {
    const data = await jobicyEnvelope({ count: 1, geo: args?.geo, industry: args?.industry, tag: args?.tag });
    const updated = typeof data.lastUpdate === 'string' ? Date.parse(data.lastUpdate) : Number.NaN;
    const ageHours = Number.isFinite(updated) ? Math.round((Date.now() - updated) / 3_600_000) : null;
    const applied = data.appliedFilters ?? {};
    const filters = Object.entries(applied)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ') || 'none reported';
    return [
        `Jobicy remote jobs feed: API version ${data.apiVersion ?? 'not reported'} · status code ${data.statusCode ?? 'not reported'} · success ${data.success === true ? 'true' : data.success === false ? 'false' : 'not reported'}`,
        `Feed last updated ${data.lastUpdate ?? 'not reported'}${ageHours !== null ? ` (${ageHours} hour(s) ago${ageHours > 24 ? ', which is stale for a job board' : ''})` : ''}`,
        `Jobs matching the filters sent: ${data.jobCount ?? 'not reported'}`,
        `Filters the service applied: ${filters}`,
        data.documentationUrl ? `Documentation: ${data.documentationUrl}` : 'Documentation: not reported',
        data.friendlyNotice ? `Attribution notice: ${String(data.friendlyNotice).slice(0, 200)}` : 'Attribution notice: none published',
        '',
        'A stale lastUpdate means the postings below are old: check posting_freshness before trusting a search.',
    ].join('\n');
}
/** How fresh the postings actually are, which the feed header does not tell you. */
export async function postingFreshness(args) {
    const data = await jobicyEnvelope({ count: JOBICY_MAX, geo: args?.geo, industry: args?.industry, tag: args?.tag });
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    if (!jobs.length)
        return `No Jobicy postings came back for those filters${data.lastUpdate ? `; the feed was last updated ${data.lastUpdate}` : ''}.`;
    const aged = jobs
        .map((job) => ({ job, hours: jobicyAge(job.pubDate) }))
        .filter((entry) => entry.hours !== null);
    if (!aged.length)
        throw new Error(`None of the ${jobs.length} postings carries a pubDate this server can read.`);
    const buckets = [
        { label: 'under 24 hours', count: aged.filter((e) => e.hours < 24).length },
        { label: '1 to 7 days', count: aged.filter((e) => e.hours >= 24 && e.hours < 168).length },
        { label: '7 to 30 days', count: aged.filter((e) => e.hours >= 168 && e.hours < 720).length },
        { label: 'over 30 days', count: aged.filter((e) => e.hours >= 720).length },
    ];
    const ages = aged.map((e) => e.hours).sort((a, b) => a - b);
    const middle = Math.floor(ages.length / 2);
    const median = ages.length % 2 ? ages[middle] : Math.round((ages[middle - 1] + ages[middle]) / 2);
    const dated = ages.length;
    const scope = [args?.geo, args?.industry, args?.tag].filter(Boolean).join(', ') || 'no filters';
    const lines = [
        `Posting freshness for ${jobs.length} Jobicy posting(s) (${scope}); ${dated} carried a readable pubDate`,
        `Age of the newest posting ${Math.min(...ages)} hour(s); median ${median} hour(s); oldest ${Math.max(...ages)} hour(s)`,
        '',
    ];
    for (const bucket of buckets) {
        const share = ((bucket.count / dated) * 100).toFixed(1);
        lines.push(`  ${bucket.label.padEnd(16)} ${String(bucket.count).padStart(3)}  ${share.padStart(5)}%  ${'#'.repeat(Math.max(1, Math.round(Number(share) / 2)))}`);
    }
    const limit = clamp(args.limit, 5);
    lines.push('');
    lines.push(`The ${limit} most recently published posting(s):`);
    for (const [i, entry] of [...aged].sort((a, b) => a.hours - b.hours).slice(0, limit).entries()) {
        lines.push(`  ${i + 1}. ${String(entry.job.jobTitle ?? '?').slice(0, 80)} | ${entry.job.companyName ?? '?'} | ${entry.job.jobGeo ?? 'geo not reported'} | published ${entry.hours} hour(s) ago`);
    }
    return lines.join('\n');
}
