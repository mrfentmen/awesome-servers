const UA = "mrfentmen-job-search-mcp/1.0";
export class JobSearchError extends Error {
    constructor(message) {
        super(message);
        this.name = "JobSearchError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const clamp = (value, fallback, max = 50) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const truncate = (value, max = 3800) => value.length <= max ? value : `${value.slice(0, max)}\n… (truncated)`;
const str = (value) => (typeof value === "string" ? value.trim() : "");
const num = (value) => typeof value === "number" && Number.isFinite(value) ? value : undefined;
/** HN sends ids as numbers in some endpoints and strings in others. */
const asId = (value) => typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
const arr = (value) => (Array.isArray(value) ? value : []);
const names = (value, field) => arr(value)
    .map((row) => str(row[field]))
    .filter(Boolean)
    .join(", ");
const entity = (raw, code) => Number.isFinite(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : raw;
/** Minimal HTML entity decode — feeds send escaped markup, not entities we control. */
const decode = (value) => value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (raw, hex) => entity(raw, Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (raw, dec) => entity(raw, Number(dec)));
const stripHtml = (value) => decode(value)
    .replace(/<p>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
async function getJson(url) {
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new JobSearchError(`Network error: ${errorMessage(e)}`);
    }
    if (!res.ok)
        throw new JobSearchError(`${new URL(url).host} returned ${res.status}`);
    return (await res.json());
}
const matches = (job, query, location) => {
    const terms = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = [job.title, job.company, job.location, job.type ?? "", ...job.tags]
        .join(" ")
        .toLowerCase();
    if (terms.length && !terms.every((term) => haystack.includes(term)))
        return false;
    const places = (location ?? "").trim().toLowerCase();
    if (!places)
        return true;
    return places.split(/\s+/).every((part) => job.location.toLowerCase().includes(part));
};
const sortNewest = (jobs) => [...jobs].sort((a, b) => {
    const left = a.posted ? Date.parse(a.posted) : 0;
    const right = b.posted ? Date.parse(b.posted) : 0;
    return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
});
// Some boards (RemoteOK) send 0 rather than omitting pay they do not know, so a
// zero must be read as "not disclosed" instead of a salary.
const pay = (value) => {
    const parsed = num(value);
    return parsed !== undefined && parsed > 0 ? parsed : undefined;
};
const salaryLabel = (min, max, currency, period) => {
    const low = pay(min);
    const high = pay(max);
    if (low === undefined && high === undefined)
        return undefined;
    const symbol = str(currency) || "USD";
    const every = str(period);
    const format = (value) => value.toLocaleString("en-US");
    const range = low !== undefined && high !== undefined ? `${format(low)}-${format(high)}` : format((low ?? high));
    return `${symbol} ${range}${every ? `/${every}` : ""}`.trim();
};
async function fromJobicy(opts) {
    const params = new URLSearchParams({ count: String(Math.min(Math.max(opts.limit * 3, 10), 50)) });
    const query = (opts.query ?? "").trim();
    if (query)
        params.set("tag", query.split(/\s+/)[0]);
    if (opts.location)
        params.set("geo", opts.location.split(/\s+/)[0]);
    const data = await getJson(`https://jobicy.com/api/v2/remote-jobs?${params.toString()}`);
    return arr(data.jobs).map((j) => ({
        title: str(j.jobTitle),
        company: str(j.companyName),
        location: str(j.jobGeo),
        url: str(j.url),
        source: "Jobicy",
        posted: str(j.pubDate),
        type: Array.isArray(j.jobType) ? j.jobType.map(str).filter(Boolean).join("/") : str(j.jobType),
        salary: salaryLabel(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryPeriod),
        salaryLow: pay(j.salaryMin),
        salaryHigh: pay(j.salaryMax),
        salaryCurrency: str(j.salaryCurrency) || undefined,
        salaryPeriod: str(j.salaryPeriod) || undefined,
        tags: [str(j.jobIndustry), ...arr(j.jobType).map(String)].filter(Boolean),
    }));
}
async function fromArbeitnow(opts) {
    const data = await getJson("https://www.arbeitnow.com/api/job-board-api");
    return arr(data.data)
        .map((j) => ({
        title: str(j.title),
        company: str(j.company_name),
        location: str(j.location) || (j.remote === true ? "Remote" : ""),
        url: str(j.url),
        source: "Arbeitnow",
        // Arbeitnow dates postings with unix seconds, not an ISO string.
        posted: typeof j.created_at === "number" ? new Date(j.created_at * 1000).toISOString() : str(j.created_at),
        type: Array.isArray(j.job_types) ? j.job_types.map(str).filter(Boolean).join("/") : "",
        tags: Array.isArray(j.tags) ? j.tags.map(str).filter(Boolean) : [],
    }))
        .filter((job) => matches(job, opts.query, opts.location));
}
async function fromRemoteOk(opts) {
    // The first element of the feed is a legal notice, not a job.
    const data = await getJson("https://remoteok.com/api");
    return arr(data)
        .filter((j) => str(j.position))
        .map((j) => ({
        title: str(j.position),
        company: str(j.company),
        location: str(j.location) || "Remote",
        url: str(j.url) || str(j.apply_url),
        source: "RemoteOK",
        posted: str(j.date),
        salary: salaryLabel(j.salary_min, j.salary_max, undefined, "year"),
        salaryLow: pay(j.salary_min),
        salaryHigh: pay(j.salary_max),
        salaryCurrency: pay(j.salary_min) !== undefined || pay(j.salary_max) !== undefined ? "USD" : undefined,
        salaryPeriod: "year",
        tags: Array.isArray(j.tags) ? j.tags.map(str).filter(Boolean) : [],
    }))
        .filter((job) => matches(job, opts.query, opts.location));
}
async function fromTheMuse(opts) {
    const pages = Math.min(Math.max(Math.ceil(opts.limit / 20), 1), 3);
    const jobs = [];
    for (let page = 1; page <= pages; page += 1) {
        const params = new URLSearchParams({ page: String(page) });
        if (opts.location)
            params.set("location", opts.location);
        const data = await getJson(`https://www.themuse.com/api/public/jobs?${params.toString()}`);
        for (const j of arr(data.results)) {
            const company = j.company;
            const refs = j.refs;
            jobs.push({
                title: str(j.name),
                company: str((company ?? {}).name),
                location: names(j.locations, "name"),
                url: str((refs ?? {}).landing_page),
                source: "The Muse",
                posted: str(j.publication_date),
                type: names(j.levels, "name"),
                tags: arr(j.categories).map((c) => str(c.name)).filter(Boolean),
            });
        }
    }
    return jobs.filter((job) => matches(job, opts.query, undefined));
}
async function fromRemotive(opts) {
    // Remotive now ignores search/category/limit, so filter the feed ourselves.
    const data = await getJson("https://remotive.com/api/remote-jobs");
    return arr(data.jobs)
        .map((j) => ({
        title: str(j.title),
        company: str(j.company_name),
        location: str(j.candidate_required_location),
        url: str(j.url),
        source: "Remotive",
        posted: str(j.publication_date),
        type: str(j.job_type),
        salary: str(j.salary) || undefined,
        tags: Array.isArray(j.tags) ? j.tags.map(str).filter(Boolean) : [],
    }))
        .filter((job) => matches(job, opts.query, opts.location));
}
async function fromHackerNews(opts) {
    const stories = await getJson("https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10");
    const thread = arr(stories.hits).find((hit) => str(hit.title).startsWith("Ask HN: Who is hiring?"));
    if (!thread)
        throw new JobSearchError("Could not find the latest Hacker News hiring thread");
    const threadId = str(thread.objectID);
    const params = new URLSearchParams({ tags: `comment,story_${threadId}`, hitsPerPage: "50" });
    const query = (opts.query ?? "").trim();
    if (query)
        params.set("query", query);
    const comments = await getJson(`https://hn.algolia.com/api/v1/search?${params.toString()}`);
    return arr(comments.hits)
        // Only top-level comments in the thread are job postings; replies are
        // discussion, which is why filtering on the text alone lets noise through.
        .filter((hit) => asId(hit.parent_id) === threadId)
        .map((hit) => {
        const text = stripHtml(str(hit.comment_text));
        const headline = (text.split("\n")[0] ?? "").trim().slice(0, 180);
        return {
            title: headline,
            company: headline.split("|")[0]?.trim() ?? "",
            location: "",
            url: `https://news.ycombinator.com/item?id=${str(hit.objectID)}`,
            source: "Hacker News",
            posted: str(hit.created_at),
            tags: [],
        };
    })
        .filter((job) => job.title.length > 12)
        .filter((job) => matches(job, query, undefined));
}
export const BOARDS = [
    { id: "jobicy", name: "Jobicy", supportsQuery: true, fetch: fromJobicy },
    { id: "arbeitnow", name: "Arbeitnow", supportsQuery: false, fetch: fromArbeitnow },
    { id: "remoteok", name: "RemoteOK", supportsQuery: false, fetch: fromRemoteOk },
    { id: "themuse", name: "The Muse", supportsQuery: false, fetch: fromTheMuse },
    { id: "remotive", name: "Remotive", supportsQuery: false, fetch: fromRemotive },
    { id: "hn", name: "Hacker News", supportsQuery: true, fetch: fromHackerNews },
];
function selectBoards(boards) {
    const wanted = (boards ?? "").trim();
    if (!wanted)
        return BOARDS;
    const ids = wanted.split(",").map((id) => id.trim().toLowerCase()).filter(Boolean);
    const known = ids.filter((id) => BOARDS.some((board) => board.id === id));
    if (!known.length) {
        throw new JobSearchError(`boards must be a comma-separated subset of: ${BOARDS.map((b) => b.id).join(", ")}`);
    }
    return BOARDS.filter((board) => known.includes(board.id));
}
const dedupe = (jobs) => {
    const seen = new Set();
    const out = [];
    for (const job of jobs) {
        const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(job);
    }
    return out;
};
async function collect(opts, boards) {
    const selected = selectBoards(boards);
    const settled = await Promise.allSettled(selected.map((board) => board.fetch(opts)));
    const jobs = [];
    const failures = [];
    const searched = [];
    settled.forEach((result, i) => {
        const board = selected[i];
        searched.push(board.name);
        if (result.status === "fulfilled")
            jobs.push(...result.value);
        else
            failures.push(`${board.name} (${errorMessage(result.reason)})`);
    });
    return { jobs, failures, searched };
}
function render(jobs, limit) {
    return jobs
        .slice(0, limit)
        .map((job, i) => {
        const bits = [job.company, job.location, job.type, job.salary].filter(Boolean);
        const lines = [`${i + 1}. ${job.title}${bits.length ? ` — ${bits.join(" | ")}` : ""}`];
        if (job.url)
            lines.push(`   ${job.url}`);
        if (job.posted)
            lines.push(`   ${job.source}, posted ${job.posted.slice(0, 10)}`);
        return lines.join("\n");
    })
        .join("\n");
}
const header = (harvest, found, limit) => {
    const shown = Math.min(found, limit);
    const lines = [
        `Searched ${harvest.searched.length} job boards (${harvest.searched.join(", ")}).`,
        `${found} matching job(s), showing ${shown} across ${harvest.searched.length} board(s).`,
    ];
    if (harvest.failures.length)
        lines.push(`Unreachable: ${harvest.failures.join("; ")}`);
    return lines.join("\n");
};
export async function searchJobs(args = {}) {
    const limit = clamp(args.limit, 10, 50);
    const harvest = await collect({ query: args.query, location: args.location, limit }, args.boards);
    const jobs = sortNewest(dedupe(harvest.jobs));
    if (!jobs.length) {
        return `${header(harvest, 0, limit)}\nNothing matched. Try a broader query, drop the location, or use latest_jobs.`;
    }
    return truncate(`${header(harvest, jobs.length, limit)}\n\n${render(jobs, limit)}`);
}
export async function latestJobs(args = {}) {
    const limit = clamp(args.limit, 10, 50);
    const harvest = await collect({ query: undefined, location: args.location, limit }, args.boards);
    const jobs = sortNewest(dedupe(harvest.jobs)).filter((job) => job.posted);
    if (!jobs.length)
        return `${header(harvest, 0, limit)}\nNo dated postings came back.`;
    return truncate(`${header(harvest, jobs.length, limit)}\nNewest first:\n\n${render(jobs, limit)}`);
}
export async function jobsByBoard(args) {
    const id = args.board.trim().toLowerCase();
    const board = BOARDS.find((b) => b.id === id || b.name.toLowerCase() === id);
    if (!board)
        throw new JobSearchError(`board must be one of: ${BOARDS.map((b) => b.id).join(", ")}`);
    const limit = clamp(args.limit, 10, 50);
    const jobs = sortNewest(dedupe(await board.fetch({ query: args.query, location: args.location, limit })));
    const note = board.supportsQuery
        ? `${board.name} filters server-side.`
        : `${board.name} has no search parameter, so results are filtered locally over the latest postings.`;
    if (!jobs.length)
        return `${board.name}: no jobs matched. ${note}`;
    return truncate(`${board.name}: ${jobs.length} matching job(s), showing ${Math.min(jobs.length, limit)}. ${note}\n\n${render(jobs, limit)}`);
}
export async function companyJobs(args) {
    const needle = args.company.trim().toLowerCase();
    if (!needle)
        throw new JobSearchError("company is required");
    const limit = clamp(args.limit, 10, 50);
    const harvest = await collect({ query: undefined, location: undefined, limit }, args.boards);
    const jobs = sortNewest(dedupe(harvest.jobs.filter((job) => job.company.toLowerCase().includes(needle))));
    if (!jobs.length) {
        return `${header(harvest, 0, limit)}\nNo posting from a company matching "${args.company}". Note most boards expose only their latest postings, so older roles may be missing.`;
    }
    return truncate(`${header(harvest, jobs.length, limit)}\n\n${render(jobs, limit)}`);
}
export async function jobCategories() {
    const lines = BOARDS.map((board) => {
        const capability = board.supportsQuery
            ? "keyword search server-side"
            : "no keyword parameter — filtered locally over latest postings";
        return `- ${board.name} (boards: "${board.id}") — ${capability}`;
    });
    return truncate([
        "This server aggregates six job boards, so there is no single shared category taxonomy. Use search_jobs for keywords, jobs_by_board to target one board, and these ids with the `boards` argument:",
        ...lines,
        "",
        "The Muse also accepts a location, and Jobicy accepts a location plus an industry tag.",
    ].join("\n"));
}
/** Only USD/year figures can be compared, so everything else is reported separately. */
const midpoint = (job) => {
    const low = job.salaryLow ?? job.salaryHigh ?? 0;
    const high = job.salaryHigh ?? job.salaryLow ?? 0;
    return (low + high) / 2;
};
// RemoteOK occasionally labels an hourly rate as an annual field, which shows up
// as a three figure "salary". Nothing under this floor is a real annual figure.
const ANNUAL_FLOOR = 1000;
const comparablePay = (job) => (job.salaryLow !== undefined || job.salaryHigh !== undefined) &&
    (job.salaryCurrency ?? "USD").toUpperCase() === "USD" &&
    /year|annual/i.test(job.salaryPeriod ?? "year") &&
    midpoint(job) >= ANNUAL_FLOOR;
const money = (value) => `USD ${Math.round(value).toLocaleString("en-US")}`;
export async function salaryInsights(args = {}) {
    const limit = clamp(args.limit, 10, 50);
    const harvest = await collect({ query: args.query, location: undefined, limit }, args.boards);
    const paid = harvest.jobs.filter((job) => job.salaryLow !== undefined || job.salaryHigh !== undefined);
    const usable = paid.filter(comparablePay);
    if (!usable.length) {
        return `${header(harvest, paid.length, limit)}\n` +
            `Only ${paid.length} job(s) published pay, and none in a comparable USD-per-year form, so no average can be computed. ` +
            `RemoteOK and Jobicy are the boards that carry salary figures.`;
    }
    const values = usable.map(midpoint).sort((a, b) => a - b);
    const median = values.length % 2
        ? values[(values.length - 1) / 2]
        : (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
    const byBoard = new Map();
    for (const job of usable)
        byBoard.set(job.source, (byBoard.get(job.source) ?? 0) + 1);
    const top = [...usable].sort((a, b) => midpoint(b) - midpoint(a)).slice(0, Math.min(limit, 10));
    const lines = top.map((job, i) => {
        const bits = [job.company, job.location].filter(Boolean).join(" | ");
        return `${i + 1}. ${job.title}${bits ? ` — ${bits}` : ""}\n   ${job.salary} (${job.source})`;
    });
    const skipped = paid.length - usable.length;
    return truncate([
        `Salary insights for ${args.query ? `"${args.query}"` : "all recent postings"} across ${harvest.searched.length} board(s).`,
        `${harvest.jobs.length} posting(s) scanned; ${paid.length} published pay, ${usable.length} comparable (${skipped} skipped as non-USD or non-annual).`,
        ``,
        `Lowest midpoint: ${money(values[0])}`,
        `Median midpoint: ${money(median)}`,
        `Highest midpoint: ${money(values[values.length - 1])}`,
        `Boards contributing pay data: ${[...byBoard.entries()].map(([name, n]) => `${name} (${n})`).join(", ")}`,
        ``,
        `Best paying matches:`,
        ...lines,
        harvest.failures.length ? `Unreachable: ${harvest.failures.join("; ")}` : "",
        `Figures are midpoints of each posting's own quoted range, and represent only the jobs that disclosed pay.`,
    ]
        .filter(Boolean)
        .join("\n"));
}
export async function boardCoverage(args = {}) {
    const probe = await Promise.all(BOARDS.map(async (board) => {
        try {
            const jobs = await board.fetch({ query: args.query, location: args.location, limit: 50 });
            return { board, count: jobs.length, ok: true, error: "" };
        }
        catch (e) {
            return { board, count: 0, ok: false, error: errorMessage(e) };
        }
    }));
    const total = probe.reduce((sum, row) => sum + row.count, 0);
    const live = probe.filter((row) => row.ok).length;
    const lines = probe
        .sort((a, b) => b.count - a.count)
        .map((row, i) => {
        const how = row.board.supportsQuery ? "server-side keyword filter" : "filtered locally over latest postings";
        const detail = row.ok ? `${row.count} job(s) — ${how}` : `unreachable — ${row.error}`;
        return `  ${i + 1}. ${row.board.name} [${row.board.id}]: ${detail}`;
    });
    return truncate([
        `Board coverage for ${args.query ? `"${args.query}"` : "an unfiltered pull"}${args.location ? ` in "${args.location}"` : ""}:`,
        `${total} job(s) across ${live} of ${BOARDS.length} reachable board(s).`,
        ...lines,
        ``,
        "Pass these ids to the `boards` argument of search_jobs, jobs_by_board or company_jobs. Counts are board-declared result sizes, so boards with a large feed naturally rank higher.",
    ].join("\n"));
}
// ---- batch-4 tools: freshness window and skill demand (2026-09-27) ----
/** Boards date postings in ISO strings; normalise to epoch milliseconds. */
function postedMs(job) {
    const raw = (job.posted ?? "").trim();
    if (!raw)
        return null;
    if (/^\d{9,13}$/.test(raw)) {
        const n = Number(raw);
        return n > 1e12 ? n : n * 1000;
    }
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
}
export async function jobsLastHours(args = {}) {
    const hours = Math.min(Math.max(Number(args.hours ?? 24) || 24, 1), 720);
    const limit = clamp(args.limit, 10, 50);
    const harvest = await collect({ query: args.query, location: args.location, limit }, args.boards);
    const cutoff = Date.now() - hours * 3600000;
    const dated = harvest.jobs.map((job) => ({ job, at: postedMs(job) }));
    const undated = dated.filter((row) => row.at === null).length;
    const fresh = dated
        .filter((row) => row.at !== null && row.at >= cutoff)
        .sort((a, b) => b.at - a.at);
    const perBoard = new Map();
    for (const row of fresh)
        perBoard.set(row.job.source, (perBoard.get(row.job.source) ?? 0) + 1);
    const head = [
        `Postings published in the last ${hours} hour(s)${args.query ? ` matching "${args.query}"` : ""}:`,
        `${header(harvest, fresh.length, limit)}`,
        undated ? `${undated} posting(s) carry no date this feed can read and are left out of the window.` : "",
    ].filter(Boolean);
    if (!fresh.length) {
        return [...head, "", "Nothing new in that window - widen the hours, or use latest_jobs for the newest postings regardless of age."].join("\n");
    }
    const age = (at) => {
        const minutes = Math.round((Date.now() - at) / 60000);
        if (minutes < 60)
            return `${minutes} minute(s) ago`;
        const hours2 = Math.floor(minutes / 60);
        return hours2 < 48 ? `${hours2} hour(s) ago` : `${Math.floor(hours2 / 24)} day(s) ago`;
    };
    const lines = fresh.slice(0, limit).map((row, i) => {
        const bits = [row.job.company, row.job.location, row.job.type, row.job.salary].filter(Boolean);
        return [
            `${i + 1}. ${row.job.title}${bits.length ? ` — ${bits.join(" | ")}` : ""}`,
            `   ${row.job.source}, ${age(row.at)}`,
            row.job.url ? `   ${row.job.url}` : "",
        ].filter(Boolean).join("\n");
    });
    return truncate([
        ...head,
        `By board: ${[...perBoard.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => `${name} (${n})`).join(", ")}`,
        "",
        ...lines,
        "",
        "Boards publish on their own cadence, so a quiet window usually means the feed has not refreshed, not that hiring stopped.",
    ].join("\n"));
}
export async function skillDemand(args = {}) {
    const limit = clamp(args.limit, 10, 50);
    const harvest = await collect({ query: args.query, location: undefined, limit }, args.boards);
    const jobs = dedupe(harvest.jobs);
    if (!jobs.length)
        return `${header(harvest, 0, limit)}\nNo postings to analyse.`;
    const tags = new Map();
    const companies = new Map();
    let tagged = 0;
    for (const job of jobs) {
        if (job.tags.length)
            tagged += 1;
        for (const tag of job.tags) {
            const key = tag.trim().toLowerCase();
            if (key)
                tags.set(key, (tags.get(key) ?? 0) + 1);
        }
        const company = job.company.trim();
        if (company)
            companies.set(company, (companies.get(company) ?? 0) + 1);
    }
    const ranked = [...tags.entries()].sort((a, b) => b[1] - a[1]);
    const share = (count) => `${((count / jobs.length) * 100).toFixed(1)}%`;
    const topTags = ranked.slice(0, Math.min(limit, 25)).map(([tag, count], i) => `  ${String(i + 1).padStart(2)}. ${tag} — ${count} posting(s), ${share(count)} of the sample`);
    const hiring = [...companies.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return truncate([
        `Skill demand${args.query ? ` for "${args.query}"` : ""} across ${harvest.searched.length} board(s):`,
        `${jobs.length} posting(s) scanned, ${tagged} of them publish tags (${share(tagged)}).`,
        "",
        ranked.length ? "Most requested tags:" : "No board in this set publishes tags for these postings.",
        ...topTags,
        "",
        `Tags come from the boards that publish them (Arbeitnow, RemoteOK, Remotive, The Muse); Jobicy and Hacker News do not, so their postings cannot be counted here.`,
        "",
        companies.size ? `Posting the most roles: ${hiring.map(([name, n]) => `${name} (${n})`).join(", ")}` : "",
        `Counts are tag occurrences, not hires: a posting listing "react" twice counts once.`,
    ].filter((line) => line !== "").join("\n"));
}
// ---- muxG tools:
const HN_ITEM = "https://hacker-news.firebaseio.com/v0/item";
const stripTags = (html) => html
    .replace(/<p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
async function hnJson(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new Error(`Hacker News returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new Error("Hacker News returned an empty body.");
    return JSON.parse(text);
}
const fetchInBatches = async (ids, size) => {
    const out = [];
    for (let i = 0; i < ids.length; i += size) {
        const batch = ids.slice(i, i + size);
        const rows = await Promise.all(batch.map((id) => hnJson(`${HN_ITEM}/${id}.json`).catch(() => null)));
        for (const row of rows)
            if (row)
                out.push(row);
    }
    return out;
};
/**
 * The actual job listings inside an "Ask HN: Who is hiring?" thread. The comment
 * bodies are not in the search index, so this reads them from the HN item API.
 */
export async function hiringThread(args) {
    const limit = clamp(args.limit, 10, 40);
    const commentCount = clamp(args.comments, 40, 200);
    const wanted = String(args.month ?? "").trim().toLowerCase();
    const search = await hnJson(`${'https://hn.algolia.com/api/v1/search'}?query=${encodeURIComponent("Ask HN: Who is hiring")}&tags=story&hitsPerPage=50`);
    const threads = (search.hits ?? []).filter((hit) => /^ask hn: who is hiring/i.test(String(hit.title ?? "")));
    if (!threads.length)
        throw new Error("The HN search index returned no who-is-hiring thread.");
    const chosen = wanted
        ? threads.find((hit) => String(hit.title ?? "").toLowerCase().includes(wanted))
        : threads.sort((a, b) => (b.num_comments ?? 0) - (a.num_comments ?? 0))[0];
    if (!chosen) {
        const months = threads.slice(0, 12).map((hit) => String(hit.title ?? "")).join("; ");
        return `No hiring thread matches "${args.month}". Threads found include: ${months}.`;
    }
    const thread = await hnJson(`${HN_ITEM}/${chosen.objectID}.json`);
    const kids = (thread.kids ?? []).slice(0, commentCount);
    if (!kids.length)
        throw new Error(`Thread "${chosen.title}" has no top level comments.`);
    const comments = await fetchInBatches(kids, 10);
    const listings = comments.filter((comment) => comment.text && comment.text.length > 20);
    const lines = [
        `${chosen.title ?? "thread"} - HN item ${chosen.objectID}, posted ${String(chosen.created_at ?? "date not reported").slice(0, 10)}`,
        `Reading the first ${commentCount} top level comment(s); ${listings.length} carried a posting body.`,
        "The | fields below are as the commenter wrote them, not a schema this server imposed.",
        "",
    ];
    for (const [i, comment] of listings.slice(0, limit).entries()) {
        const body = stripTags(String(comment.text));
        const firstLine = body.split("\n")[0].slice(0, 220);
        lines.push(`  ${i + 1}. ${firstLine || "(first line empty)"}`);
        if (comment.by)
            lines.push(`     posted by ${comment.by}${comment.time ? ` on ${new Date(comment.time * 1000).toISOString().slice(0, 10)}` : ""}`);
        const rest = body.slice(body.split("\n")[0].length).trim();
        if (rest)
            lines.push(`     ${rest.replace(/\n/g, " ").slice(0, 220)}`);
    }
    if (listings.length > limit)
        lines.push(`  ...and ${listings.length - limit} more posting(s) in this batch of comments.`);
    if (kids.length < (thread.kids ?? []).length) {
        lines.push(`  (${(thread.kids ?? []).length - kids.length} further top level comment(s) not read; raise the comments argument.)`);
    }
    return lines.join("\n");
}
const ROLE_FAMILIES = [
    { family: "software engineering", pattern: /\b(software|backend|back-end|frontend|front-end|full ?stack|mobile|ios|android|systems|platform|embedded|firmware|web)\b.*\b(engineer|developer|programmer|dev)\b|\b(engineer|developer)\b/i },
    { family: "infrastructure and SRE", pattern: /\b(sre|site reliability|devops|platform|infrastructure|cloud)\b/i },
    { family: "data and machine learning", pattern: /\b(data|ml|machine learning|deep learning|ai|nlp|research scientist|analytics|statistic)/i },
    { family: "security", pattern: /\b(security|infosec|appsec|penetration|threat)\b/i },
    { family: "design", pattern: /\b(design|ux|ui|creative|art director|brand)\b/i },
    { family: "product management", pattern: /\b(product manager|product management|product owner|po)\b/i },
    { family: "project and programme", pattern: /\b(project manager|program manager|programme|scrum|delivery)\b/i },
    { family: "sales and account", pattern: /\b(sales|account executive|ae|account manager|business development|solutions engineer|customer success)\b/i },
    { family: "marketing and content", pattern: /\b(marketing|content|seo|social media|communications|brand)\b/i },
    { family: "support and operations", pattern: /\b(support|customer success|operations|ops|service desk)\b/i },
    { family: "finance and legal", pattern: /\b(finance|accounting|accountant|legal|counsel|compliance|tax)\b/i },
    { family: "people and recruiting", pattern: /\b(people|talent|recruit|human resources|hr|hris)\b/i },
    { family: "research", pattern: /\b(research|phd|postdoc|scientist)\b/i },
];
const roleFamilyOf = (title) => {
    for (const entry of ROLE_FAMILIES)
        if (entry.pattern.test(title))
            return entry.family;
    return "unclassified";
};
/** What kinds of roles the live aggregate actually contains, counted by title, with the boards they came from. */
export async function roleTaxonomy(args) {
    const limit = clamp(args.limit, 8, 30);
    const sample = clamp(args.sample, 40, 300);
    const harvest = await collect({ query: args.query, location: undefined, limit: sample }, args.boards);
    const jobs = dedupe(harvest.jobs);
    if (!jobs.length)
        return `No postings to analyse from ${harvest.searched.length} board(s) that answered${harvest.failures.length ? `; ${harvest.failures.length} failed` : ""}.`;
    const families = new Map();
    const searched = new Set(harvest.searched);
    for (const job of jobs) {
        const family = roleFamilyOf(job.title);
        const entry = families.get(family) ?? { count: 0, samples: [], boards: new Map() };
        entry.count += 1;
        if (entry.samples.length < 3)
            entry.samples.push(job.title.trim().slice(0, 70));
        const board = job.source || "board not reported";
        entry.boards.set(board, (entry.boards.get(board) ?? 0) + 1);
        families.set(family, entry);
    }
    const ranked = [...families.entries()].sort((a, b) => b[1].count - a[1].count);
    const share = (count) => `${((count / jobs.length) * 100).toFixed(1)}%`;
    const lines = [
        `Role families in ${jobs.length} deduplicated posting(s) from ${searched.size} board(s) that answered`,
        "Families are assigned by matching the posting title, so a title that fits nothing lands in unclassified.",
        "",
    ];
    for (const [family, entry] of ranked.slice(0, limit)) {
        const boards = Array.from(entry.boards.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([board, count]) => `${board} (${count})`)
            .join(", ");
        lines.push(`  ${family}: ${entry.count} posting(s), ${share(entry.count)}${entry.samples.length ? ` - e.g. ${entry.samples.join(" / ")}` : ""}`);
        lines.push(`     from ${boards}`);
    }
    if (ranked.length > limit)
        lines.push(`  ...and ${ranked.length - limit} further family name(s).`);
    return truncate(lines.join("\n"));
}
