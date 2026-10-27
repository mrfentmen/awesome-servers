const BASE = 'https://remoteok.com/api';
const UA = 'mrfentmen-remoteok-mcp/1.0';
const clamp = (value, fallback, max) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const plain = (html) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const pay = (job) => job.salary_max ? `$${job.salary_min ?? '?'}-$${job.salary_max}` : 'salary n/a';
const row = (job, index) => `${index + 1}. ${job.position ?? '?'} @ ${job.company ?? '?'} - ${pay(job)} | ${(job.tags ?? []).slice(0, 4).join(', ')}` +
    ` | ${job.location || 'remote'}`;
async function fetchJobs(query) {
    const suffix = query ? `?tags=${encodeURIComponent(query)}` : '?tags=';
    const res = await fetch(`${BASE}${suffix}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`RemoteOK returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d))
        return [];
    // The first element of the RemoteOK feed is a legal notice, not a job.
    return d.filter((entry) => entry && (entry.position || entry.company));
}
export async function jobs(args) {
    const limit = clamp(args?.limit, 10, 25);
    const list = await fetchJobs();
    if (!list.length)
        return 'No jobs returned.';
    return `RemoteOK jobs (latest ${Math.min(limit, list.length)}):\n` + list.slice(0, limit).map(row).join('\n');
}
export async function search(args) {
    const query = String(args?.query ?? '').trim();
    if (!query)
        throw new Error('Provide search terms.');
    const limit = clamp(args?.limit, 10, 25);
    const list = await fetchJobs(query);
    if (!list.length)
        return `No jobs for "${query}".`;
    return `RemoteOK jobs tagged "${query}" (${Math.min(limit, list.length)}):\n` +
        list.slice(0, limit).map(row).join('\n');
}
export async function job(args) {
    const id = String(args?.job_id ?? '').trim();
    if (!id)
        throw new Error('job_id is required.');
    const list = await fetchJobs();
    const found = list.find((entry) => String(entry.id) === id || entry.slug === id);
    if (!found)
        return `No RemoteOK job with id ${id} in the current feed. Use the jobs tool to list ids.`;
    return `${found.position ?? '?'} at ${found.company ?? '?'}\n` +
        `Location: ${found.location || 'remote'} | Pay: ${pay(found)}\n` +
        `Tags: ${(found.tags ?? []).join(', ') || 'none'} | Posted: ${String(found.date ?? '?').slice(0, 10)}\n` +
        `Apply: ${found.apply_url ?? found.url ?? '?'}\n\n` +
        plain(found.description).slice(0, 4000);
}
export async function topSalaries(args) {
    const limit = clamp(args?.limit, 10, 25);
    const list = await fetchJobs();
    const paid = list
        .filter((entry) => Number(entry.salary_max ?? 0) > 0)
        .sort((a, b) => Number(b.salary_max ?? 0) - Number(a.salary_max ?? 0))
        .slice(0, limit);
    if (!paid.length)
        return 'No RemoteOK jobs in the current feed publish a salary.';
    return `Highest-paying RemoteOK jobs (from ${list.length} live postings):\n` +
        paid.map((entry, i) => `${i + 1}. ${entry.position ?? '?'} @ ${entry.company ?? '?'} - ${pay(entry)} (${entry.location || 'remote'})`).join('\n');
}
export async function companies(args) {
    const limit = clamp(args?.limit, 20, 50);
    const list = await fetchJobs();
    const counts = new Map();
    for (const entry of list) {
        const name = entry.company?.trim();
        if (name)
            counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    if (!counts.size)
        return 'No RemoteOK companies in the current feed.';
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    return `Companies hiring on RemoteOK (from ${list.length} live postings):\n` +
        ranked.map(([name, count], i) => `${i + 1}. ${name} - ${count} opening(s)`).join('\n');
}
export async function tags(args) {
    const limit = clamp(args?.limit, 20, 50);
    const list = await fetchJobs();
    const counts = new Map();
    for (const entry of list) {
        for (const tag of entry.tags ?? []) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
    }
    if (!counts.size)
        return 'No RemoteOK tags in the current feed.';
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    return `Top RemoteOK tags (from ${list.length} live postings):\n` +
        ranked.map(([tag, count], i) => `${i + 1}. ${tag} - ${count} job(s)`).join('\n');
}
const hoursOld = (job) => {
    if (typeof job.epoch === "number" && job.epoch > 0)
        return (Date.now() / 1000 - job.epoch) / 3600;
    const parsed = Date.parse(job.date ?? "");
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : (Date.now() - parsed) / 3600000;
};
const tally = (values) => {
    const counts = new Map();
    for (const value of values) {
        const key = value.trim().toLowerCase();
        if (key)
            counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};
const ageLabel = (hours) => (hours < 1 ? `${Math.round(hours * 60)} min ago` : hours < 24 ? `${Math.floor(hours)}h ago` : `${Math.floor(hours / 24)}d ago`);
/**
 * Jobs posted inside a time window. The public feed is a rolling list, so
 * "newest" is a filter the feed itself does not offer.
 */
export async function newestJobs(args) {
    const hours = Math.min(Math.max(Math.trunc(args.hours ?? 24), 1), 720);
    const limit = clamp(args.limit, 10, 50);
    const all = await fetchJobs();
    const fresh = all.filter((job) => hoursOld(job) <= hours).sort((a, b) => hoursOld(a) - hoursOld(b));
    if (!fresh.length)
        return `Nothing in the RemoteOK feed was posted in the last ${hours} hour(s). The feed holds ${all.length} job(s) in total.`;
    const tags = tally(fresh.flatMap((job) => job.tags ?? [])).slice(0, 8);
    const companies = new Set(fresh.map((job) => (job.company ?? "").toLowerCase()).filter(Boolean));
    return [
        `Posted in the last ${hours} hour(s): ${fresh.length} of ${all.length} job(s) on the feed`,
        `  ${companies.size} compan${companies.size === 1 ? "y" : "ies"} hiring | tags in this window: ${tags.map(([tag, n]) => `${tag} (${n})`).join(", ") || "none"}`,
        "",
        ...fresh.slice(0, limit).map((job, i) => `${i + 1}. ${ageLabel(hoursOld(job))} — ${job.position ?? "?"} @ ${job.company ?? "?"} — ${pay(job)} | ${job.location || "remote"}`),
        fresh.length > limit ? `\nShowing ${limit} of ${fresh.length}.` : "",
    ].filter((line) => line !== "").join("\n");
}
/**
 * Jobs that carry every tag given, which is how a skills intersection is
 * searched: "react" plus "senior" finds roles the feed's single-tag filter
 * cannot express.
 */
export async function tagCombinations(args) {
    const wanted = (args.tags ?? []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
    if (wanted.length < 2)
        throw new Error("Give at least two tags, e.g. ['react', 'senior'].");
    const limit = clamp(args.limit, 10, 40);
    const all = await fetchJobs();
    const hits = all.filter((job) => {
        const jobTags = (job.tags ?? []).map((tag) => tag.toLowerCase());
        return wanted.every((want) => jobTags.some((tag) => tag === want || tag.includes(want)));
    });
    if (!hits.length)
        return `No job on the current feed carries all of: ${wanted.join(" + ")}. The feed returns a rolling sample, so a narrower combination can come back empty.`;
    const withPay = hits.filter((job) => (job.salary_max ?? 0) > 0);
    return [
        `Jobs tagged ${wanted.join(" + ")}: ${hits.length} of ${all.length} on the feed`,
        withPay.length ? `  ${withPay.length} publish a salary, top ${Math.max(...withPay.map((job) => job.salary_max ?? 0)).toLocaleString()} USD` : "  none of them publishes a salary",
        "",
        ...hits.slice(0, limit).map((job, i) => `${i + 1}. ${job.position ?? "?"} @ ${job.company ?? "?"} — ${pay(job)} | ${(job.tags ?? []).slice(0, 5).join(", ")}`),
        hits.length > limit ? `\nShowing ${limit} of ${hits.length}.` : "",
    ].filter((line) => line !== "").join("\n");
}
/**
 * Everything one company has open right now, plus the tag mix and pay range of
 * its roles — the question a candidate asks before applying anywhere.
 */
export async function companyJobs(args) {
    const wanted = (args.company ?? "").trim().toLowerCase();
    if (wanted.length < 2)
        throw new Error("Give a company name, e.g. 'stripe'.");
    const limit = clamp(args.limit, 15, 40);
    const all = await fetchJobs();
    const hits = all.filter((job) => (job.company ?? "").toLowerCase().includes(wanted));
    if (!hits.length)
        return `No company on the current feed matches "${args.company}". The feed holds ${all.length} job(s) at a time.`;
    const exact = hits.filter((job) => (job.company ?? "").toLowerCase() === wanted);
    const chosen = exact.length ? exact : hits;
    const name = chosen[0].company ?? args.company;
    const tags = tally(chosen.flatMap((job) => job.tags ?? [])).slice(0, 10);
    const pays = chosen.map((job) => job.salary_max ?? 0).filter((n) => n > 0);
    return [
        `${name}: ${chosen.length} open role(s) on the feed`,
        pays.length ? `  published pay range: ${Math.min(...chosen.map((job) => job.salary_min ?? 0).filter((n) => n > 0)).toLocaleString()} to ${Math.max(...pays).toLocaleString()} USD` : "  no salary published",
        `  tags across its roles: ${tags.map(([tag, n]) => `${tag} (${n})`).join(", ") || "none"}`,
        "",
        ...chosen.slice(0, limit).map((job, i) => `${i + 1}. ${job.position ?? "?"} — ${pay(job)} | ${job.location || "remote"} | ${(job.tags ?? []).slice(0, 4).join(", ")}\n   ${job.url ?? job.apply_url ?? ""}`),
        chosen.length > limit ? `\nShowing ${limit} of ${chosen.length}.` : "",
    ].filter((line) => line !== "").join("\n");
}
function median(values) {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
const money = (value) => `$${Math.round(value).toLocaleString()}`;
const pct = (part, whole) => (whole > 0 ? `${((part / whole) * 100).toFixed(0)}%` : "n/a");
/**
 * How complete the feed actually is: what share of postings disclose a salary,
 * name a location, are verified and carry any tags at all, and how the postings
 * spread across the days they were listed. Most of this data is missing, and
 * any statistic drawn from it has to say so.
 */
export async function marketCensus(args) {
    const cap = Math.min(Math.max(Number(args?.limit) || 0 || 0, 0), 400);
    const list = await fetchJobs();
    if (!list.length)
        return 'RemoteOK returned no jobs, so there is nothing to count.';
    const sample = cap > 0 ? list.slice(0, cap) : list;
    const withSalary = sample.filter((job) => (job.salary_max ?? 0) > 0);
    const withLocation = sample.filter((job) => String(job.location ?? '').trim().length > 0);
    const verified = sample.filter((job) => job.verified === true);
    const withTags = sample.filter((job) => (job.tags ?? []).length > 0);
    const withApplyUrl = sample.filter((job) => String(job.apply_url ?? '').trim().length > 0);
    const withDescription = sample.filter((job) => String(job.description ?? '').trim().length > 0);
    const byDay = new Map();
    for (const job of sample) {
        const day = String(job.date ?? '').slice(0, 10);
        if (!day)
            continue;
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
    const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    const oldest = days[days.length - 1];
    const newest = days[0];
    const tagDepth = sample.reduce((sum, job) => sum + (job.tags ?? []).length, 0);
    return [
        `RemoteOK feed census (${sample.length} posting(s) inspected${cap > 0 ? `, capped from ${list.length}` : ''})`,
        '',
        `Field completeness:`,
        `  disclose a salary band   ${String(withSalary.length).padStart(4)} / ${sample.length}  (${pct(withSalary.length, sample.length)})`,
        `  name any location        ${String(withLocation.length).padStart(4)} / ${sample.length}  (${pct(withLocation.length, sample.length)})`,
        `  carry at least one tag   ${String(withTags.length).padStart(4)} / ${sample.length}  (${pct(withTags.length, sample.length)})`,
        `  are marked verified      ${String(verified.length).padStart(4)} / ${sample.length}  (${pct(verified.length, sample.length)})`,
        `  publish an apply URL     ${String(withApplyUrl.length).padStart(4)} / ${sample.length}  (${pct(withApplyUrl.length, sample.length)})`,
        `  carry any description    ${String(withDescription.length).padStart(4)} / ${sample.length}  (${pct(withDescription.length, sample.length)})`,
        `  average tags per posting ${(tagDepth / Math.max(sample.length, 1)).toFixed(1)}`,
        '',
        `Listing age:`,
        days.length
            ? `  ${days.length} distinct day(s) from ${oldest?.[0]} to ${newest?.[0]}`
            : '  no posting carries a usable date',
        newest ? `  newest day: ${newest[0]} with ${newest[1]} posting(s)` : '',
        oldest ? `  oldest day: ${oldest[0]} with ${oldest[1]} posting(s)` : '',
        days.length
            ? `  busiest: ${[...byDay.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([day, n]) => `${day} (${n})`).join(', ')}`
            : '',
        `  median postings per active day: ${days.length ? median(days.map(([, n]) => n)) : 0}`,
        '',
        `What this means: any salary figure drawn from this feed rests on the ${withSalary.length} posting(s) that disclose a band, which is ${pct(withSalary.length, sample.length)} of it. The rest are recorded as undisclosed rather than as zero.`,
        'Source: the public RemoteOK feed, counted as published.',
    ]
        .filter((line) => line !== '')
        .join('\n');
}
/**
 * What a tag pays, computed only from the postings that actually publish a band.
 * The sample size is shown beside every figure, because a five-posting tag is
 * an anecdote and a forty-posting tag is not.
 */
export async function salaryByTag(args) {
    const limit = Math.min(Math.max(Number(args?.limit) || 15 || 15, 1), 30);
    const minPosts = Math.min(Math.max(Number(args?.minPosts) || 3 || 3, 1), 20);
    const list = await fetchJobs();
    if (!list.length)
        return 'RemoteOK returned no jobs, so there is nothing to price.';
    const paid = list.filter((job) => (job.salary_max ?? 0) > 0);
    if (!paid.length) {
        return `None of the ${list.length} posting(s) RemoteOK returned publishes a salary band, so no tag can be priced.`;
    }
    const byTag = new Map();
    for (const job of paid) {
        const top = Math.max(job.salary_min ?? 0, job.salary_max ?? 0);
        for (const tag of job.tags ?? []) {
            const listForTag = byTag.get(tag) ?? [];
            listForTag.push(top);
            byTag.set(tag, listForTag);
        }
    }
    const rows = [...byTag.entries()]
        .filter(([, values]) => values.length >= minPosts)
        .map(([tag, values]) => ({ tag, n: values.length, min: Math.min(...values), med: median(values), max: Math.max(...values) }))
        .sort((a, b) => b.med - a.med);
    if (!rows.length) {
        return `Only ${paid.length} posting(s) publish a band and no tag reaches ${minPosts} of them. Lower min_posts to see the thin tags.`;
    }
    const bands = (value) => {
        if (value >= 200000)
            return '200k+';
        if (value >= 150000)
            return '150-200k';
        if (value >= 100000)
            return '100-150k';
        if (value >= 60000)
            return '60-100k';
        if (value >= 30000)
            return '30-60k';
        return 'under 30k';
    };
    const bandCounts = new Map();
    for (const row of rows)
        bandCounts.set(bands(row.med), (bandCounts.get(bands(row.med)) ?? 0) + 1);
    return [
        `Salary by tag on RemoteOK (from the ${paid.length} of ${list.length} posting(s) that publish a band)`,
        `  ${rows.length} tag(s) reach at least ${minPosts} priced posting(s)`,
        '',
        'Tag                     posts    min       median    max      band',
        ...rows.slice(0, limit).map((row) => `  ${row.tag.slice(0, 22).padEnd(22)} ${String(row.n).padStart(4)}  ${money(row.min).padStart(9)} ${money(row.med).padStart(11)} ${money(row.max).padStart(9)}  ${bands(row.med)}`),
        rows.length > limit ? `  (+${rows.length - limit} more tags)` : '',
        '',
        `Where the medians sit: ${[...bandCounts.entries()].sort((a, b) => b[1] - a[1]).map(([b, n]) => `${b} x${n}`).join(', ')}`,
        '',
        'Each figure is the top of that posting\'s published band, so a range like $100k-$150k counts as 150k. Bands are annual and postings mix contract and permanent roles, which the feed does not separate.',
        'Source: the public RemoteOK feed. Small sample sizes are shown rather than smoothed away.',
    ]
        .filter((line) => line !== '')
        .join('\n');
}
