/**
 * Ashby public posting API client, keyless.
 * Docs: https://developers.ashbyhq.com/docs/posting-api
 */
const BASE = "https://api.ashbyhq.com/posting-api";
export class AshbyError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "ashby-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new AshbyError("No such organization board. Check the slug (e.g. 'ashby').");
    if (!res.ok)
        throw new AshbyError(`Ashby error ${res.status}`);
    return (await res.json());
}
export async function listJobs(org, limit = 10) {
    if (!/^[A-Za-z0-9-]+$/.test(org.trim()))
        throw new AshbyError(`Not an org slug: "${org}".`);
    const data = await getJson(`/job-board/${encodeURIComponent(org.trim())}`);
    const rows = Array.isArray(data.jobs) ? data.jobs : [];
    return rows.slice(0, limit).map((j) => ({
        id: String(j.id),
        title: j.title,
        department: j.department,
        location: j.locationName ?? j.location,
        type: j.employmentType,
        url: j.jobUrl,
    }));
}
export function formatJob(j, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const meta = [j.department, j.location, j.type].filter(Boolean).join(" · ");
    return `${prefix}[${j.id}] ${j.title ?? "(untitled)"}${meta ? ` (${meta})` : ""}${j.url ? `\n   ${j.url}` : ""}`;
}
function checkedOrg(org) {
    const value = (org ?? "").trim();
    if (!/^[A-Za-z0-9-]+$/.test(value))
        throw new AshbyError(`Not an org slug: "${org}".`);
    return encodeURIComponent(value);
}
async function fetchBoard(org, includeCompensation = false) {
    const suffix = includeCompensation ? "?includeCompensation=true" : "";
    const data = await getJson(`/job-board/${checkedOrg(org)}${suffix}`);
    return Array.isArray(data.jobs) ? data.jobs : [];
}
const teamOf = (job) => [job.department, job.team].filter(Boolean).join(" / ") || "no team";
const placeOf = (job) => [job.location ?? job.locationName, job.isRemote ? "remote" : "", job.employmentType]
    .filter(Boolean)
    .join(" · ") || "no location given";
const brief = (job, index) => `${index + 1}. [${job.id ?? "?"}] ${job.title ?? "(untitled)"} (${teamOf(job)}) - ${placeOf(job)}` +
    `${job.compensation?.compensationTierSummary ? `\n   comp: ${job.compensation.compensationTierSummary}` : ""}` +
    `${job.jobUrl ? `\n   ${job.jobUrl}` : ""}`;
export async function searchJobs(org, query, limit = 10) {
    const needle = String(query ?? "").trim().toLowerCase();
    if (!needle)
        throw new AshbyError("query is required.");
    const jobs = await fetchBoard(org);
    const hits = jobs.filter((job) => `${job.title ?? ""} ${job.department ?? ""} ${job.team ?? ""} ${job.location ?? ""} ${job.locationName ?? ""}`
        .toLowerCase()
        .includes(needle));
    if (!hits.length)
        return `No roles at ${org} match "${query}" (searched ${jobs.length}).`;
    return `Ashby jobs at ${org} matching "${query}" (${hits.length} of ${jobs.length}):\n` +
        hits.slice(0, limit).map(brief).join("\n");
}
export async function getJob(org, jobId) {
    const id = String(jobId ?? "").trim();
    if (!id)
        throw new AshbyError("job_id is required.");
    const jobs = await fetchBoard(org);
    const found = jobs.find((job) => String(job.id) === id);
    if (!found)
        return `No role with id ${id} at ${org}. Use list_jobs or search_jobs to get an id.`;
    const description = String(found.descriptionPlain ?? "").replace(/\s+/g, " ").trim();
    return `${found.title ?? "(untitled)"} at ${org}\n` +
        `Team: ${teamOf(found)}\n` +
        `Location: ${placeOf(found)}\n` +
        `Published: ${String(found.publishedAt ?? "?").slice(0, 10)}\n` +
        `Apply: ${found.jobUrl ?? "?"}\n\n` +
        description.slice(0, 4000);
}
export async function departments(org) {
    const jobs = await fetchBoard(org);
    if (!jobs.length)
        return `No open roles at ${org}.`;
    const counts = new Map();
    for (const job of jobs) {
        const key = job.department || "unassigned";
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return `Ashby departments at ${org} (${ranked.length} hiring, ${jobs.length} roles):\n` +
        ranked.map(([name, count], i) => `${i + 1}. ${name} - ${count} role(s)`).join("\n");
}
export async function remoteJobs(org, limit = 10) {
    const jobs = await fetchBoard(org);
    const hits = jobs.filter((job) => job.isRemote === true);
    if (!hits.length)
        return `No remote roles at ${org} right now.`;
    return `Remote roles at ${org} (${hits.length} of ${jobs.length}):\n` +
        hits.slice(0, limit).map(brief).join("\n");
}
export async function compensation(org, limit = 10) {
    const jobs = await fetchBoard(org, true);
    const paid = jobs.filter((job) => Boolean(job.compensation?.compensationTierSummary));
    if (!paid.length)
        return `No published compensation ranges at ${org} right now.`;
    return `Roles with published pay at ${org} (${paid.length} of ${jobs.length}):\n` +
        paid.slice(0, limit).map(brief).join("\n");
}
/** Sub-teams listed on the roles, finer-grained than the department roll-up. */
export async function listTeams(org) {
    const jobs = await fetchBoard(org);
    if (!jobs.length)
        return `No open roles at ${org}.`;
    const counts = new Map();
    for (const job of jobs) {
        const key = String(job.team ?? "").trim() || "no team listed";
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return `Ashby teams at ${org} (${ranked.length} team(s) across ${jobs.length} roles):\n` +
        ranked.map(([name, count], i) => `${i + 1}. ${name} - ${count} role(s)`).join("\n");
}
/** Every location a board hires into, including secondary locations. */
export async function listLocations(org) {
    const jobs = (await fetchBoard(org));
    if (!jobs.length)
        return `No open roles at ${org}.`;
    const counts = new Map();
    let remote = 0;
    for (const job of jobs) {
        if (job.isRemote)
            remote += 1;
        const seen = new Set();
        const places = [job.location ?? job.locationName, ...(job.secondaryLocations ?? []).map((entry) => entry.location)];
        for (const place of places) {
            const key = String(place ?? "").trim();
            if (!key || seen.has(key))
                continue;
            seen.add(key);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return `Ashby locations at ${org} (${ranked.length} location(s) across ${jobs.length} roles, ${remote} remote):\n` +
        ranked.map(([name, count], i) => `${i + 1}. ${name} - ${count} role(s)`).join("\n");
}
/** Open roles sorted by their publish date, newest first. */
export async function newestJobs(org, limit = 10) {
    const jobs = await fetchBoard(org);
    if (!jobs.length)
        return `No open roles at ${org}.`;
    const dated = jobs.filter((job) => job.publishedAt);
    const sorted = [...(dated.length ? dated : jobs)].sort((a, b) => String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")));
    const oldest = String(sorted[sorted.length - 1]?.publishedAt ?? "").slice(0, 10);
    return `Newest roles at ${org} (${jobs.length} open, dated back to ${oldest || "?"}):\n` +
        sorted.slice(0, limit).map(brief).join("\n");
}
// ---- gap1 tools:
/** How long the currently open roles have been listed for. */
export async function postingAge(org, limit = 10) {
    const jobs = await fetchBoard(org);
    if (!jobs.length)
        return `No open roles at ${org}.`;
    const dated = jobs
        .filter((job) => job.publishedAt && !Number.isNaN(new Date(job.publishedAt).getTime()))
        .map((job) => ({
        job,
        days: Math.max(0, Math.floor((Date.now() - new Date(job.publishedAt).getTime()) / 86400000)),
    }))
        .sort((a, b) => b.days - a.days);
    if (!dated.length) {
        return `Ashby publishes no date for any of the ${jobs.length} open roles at ${org}, so posting age cannot be measured.`;
    }
    const days = dated.map((entry) => entry.days).sort((a, b) => a - b);
    const median = days.length % 2 === 1
        ? days[(days.length - 1) / 2]
        : Math.round((days[days.length / 2 - 1] + days[days.length / 2]) / 2);
    const olderThan = (bound) => dated.filter((entry) => entry.days > bound).length;
    const shown = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 50);
    return `Posting age on the ${org} board (${dated.length} dated of ${jobs.length} open role(s)):\n` +
        `Median days open: ${median} | newest ${days[0]} day(s) | oldest ${days[days.length - 1]} day(s)\n` +
        `Open longer than 30 days: ${olderThan(30)} | 60 days: ${olderThan(60)} | 90 days: ${olderThan(90)}\n` +
        `Oldest roles still open:\n` +
        dated
            .slice(0, shown)
            .map((entry, i) => `${i + 1}. ${entry.job.title ?? "(untitled)"} — ${entry.days} day(s) since ${String(entry.job.publishedAt).slice(0, 10)} (${teamOf(entry.job)})`)
            .join("\n");
}
