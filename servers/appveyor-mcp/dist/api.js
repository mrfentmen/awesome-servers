const UA = "mrfentmen-appveyor-mcp/1.0";
const GITLAB = "https://gitlab.com/api/v4";
const GITHUB = "https://api.github.com";
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
function gitlabHeaders() {
    const base = { "User-Agent": UA, Accept: "application/json" };
    const token = process.env.GITLAB_TOKEN;
    if (token)
        base["PRIVATE-TOKEN"] = token;
    return base;
}
function githubHeaders() {
    const base = { "User-Agent": UA, Accept: "application/vnd.github+json" };
    // Anonymous calls work but are limited to 60 requests per hour; a token raises that.
    const token = process.env.GITHUB_TOKEN;
    if (token)
        base.Authorization = `Bearer ${token}`;
    return base;
}
async function getJson(url, headers, notFound) {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
    if (res.status === 404)
        throw new Error(notFound);
    if (res.status === 429 || res.status === 403) {
        const remaining = res.headers.get("ratelimit-remaining");
        throw new Error(remaining === "0"
            ? "Rate limit reached. Anonymous requests are capped; set GITLAB_TOKEN or GITHUB_TOKEN for a much higher limit."
            : `The API refused the request (HTTP ${res.status}).`);
    }
    if (!res.ok)
        throw new Error(`The API returned HTTP ${res.status}.`);
    return (await res.json());
}
function gitlabProject(input) {
    const raw = (input ?? "").trim().replace(/^https?:\/\/gitlab\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
    if (!raw)
        throw new Error("Provide a project as group/project, for example gitlab-org/cli.");
    if (/^\d+$/.test(raw))
        return raw;
    if (!raw.includes("/"))
        throw new Error(`"${input}" is not a project path. Use group/project, for example gitlab-org/cli.`);
    return encodeURIComponent(raw);
}
function githubRepo(input) {
    const raw = (input ?? "").trim().replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
    const parts = raw.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(`"${input}" is not a repository. Use owner/repo, for example actions/runner.`);
    }
    return `${parts[0]}/${parts[1]}`;
}
const seconds = (value) => value == null ? "unknown" : value >= 60 ? `${Math.floor(value / 60)}m ${Math.round(value % 60)}s` : `${Math.round(value)}s`;
export async function projectPipelines(args) {
    const project = gitlabProject(args.project);
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
    const url = new URL(`${GITLAB}/projects/${project}/pipelines`);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("order_by", "id");
    url.searchParams.set("sort", "desc");
    if (args.ref?.trim())
        url.searchParams.set("ref", args.ref.trim());
    const pipelines = await getJson(url, gitlabHeaders(), `No project found at ${decodeURIComponent(project)}.`);
    const header = `Pipelines for ${decodeURIComponent(project)}${args.ref ? ` on ${args.ref}` : ""}`;
    if (!pipelines.length)
        return `${header}\n\nNo pipeline has run yet.`;
    const counts = pipelines.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
    }, {});
    const summary = Object.entries(counts).map(([status, count]) => `${count} ${status}`).join(", ");
    return [
        `${header} — last ${pipelines.length}: ${summary}`,
        "",
        ...pipelines.map((p) => {
            const age = Math.round((Date.now() - new Date(p.created_at).getTime()) / 3600000);
            // GitLab only reports a duration on the single-pipeline endpoint, so the
            // list view simply leaves it out rather than printing "unknown".
            const timing = typeof p.duration === "number" ? ` | ${seconds(p.duration)}` : "";
            return `#${p.id} ${p.status.padEnd(10)} ${p.ref ?? "unknown ref"} (${p.source ?? "unknown trigger"}) | ${age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`}${timing}`;
        }),
        "",
        "Use pipeline_detail for one pipeline and pipeline_jobs to see which job failed.",
    ].join("\n");
}
export async function pipelineDetail(args) {
    const project = gitlabProject(args.project);
    const id = Number(args.pipelineId);
    if (!Number.isInteger(id) || id <= 0)
        return "Provide the numeric pipeline id.";
    const p = await getJson(new URL(`${GITLAB}/projects/${project}/pipelines/${id}`), gitlabHeaders(), `No pipeline ${id} in ${decodeURIComponent(project)}.`);
    return [
        `Pipeline #${p.id} in ${decodeURIComponent(project)}`,
        `Status: ${p.status}`,
        `Branch or tag: ${p.ref ?? "unknown"} | Commit: ${(p.sha ?? "").slice(0, 12) || "unknown"}`,
        `Triggered by: ${p.source ?? "unknown"}`,
        `Created: ${p.created_at} | Updated: ${p.updated_at}`,
        `Duration: ${seconds(p.duration)}`,
        `URL: ${p.web_url}`,
    ].join("\n");
}
export async function pipelineJobs(args) {
    const project = gitlabProject(args.project);
    const id = Number(args.pipelineId);
    if (!Number.isInteger(id) || id <= 0)
        return "Provide the numeric pipeline id.";
    const limit = Math.min(Math.max(Number(args.limit ?? 30) || 30, 1), 100);
    const url = new URL(`${GITLAB}/projects/${project}/pipelines/${id}/jobs`);
    url.searchParams.set("per_page", String(limit));
    const jobs = await getJson(url, gitlabHeaders(), `No pipeline ${id} in ${decodeURIComponent(project)}.`);
    if (!jobs.length)
        return `Pipeline #${id} has no jobs recorded.`;
    const failed = jobs.filter((j) => j.status === "failed");
    const lines = [
        `Jobs in pipeline #${id} (${decodeURIComponent(project)}) — ${jobs.length} job(s), ${failed.length} failed`,
        "",
    ];
    const byStage = new Map();
    for (const job of jobs) {
        const stage = job.stage ?? "unknown stage";
        byStage.set(stage, [...(byStage.get(stage) ?? []), job]);
    }
    for (const [stage, stageJobs] of byStage) {
        lines.push(`Stage: ${stage}`);
        for (const job of stageJobs) {
            lines.push(`  ${job.status.padEnd(9)} ${job.name} (${seconds(job.duration)})${job.allow_failure ? " [allowed to fail]" : ""}`);
            if (job.failure_reason)
                lines.push(`     reason: ${job.failure_reason.replace(/_/g, " ")}`);
        }
    }
    if (failed.length) {
        lines.push("", `First failure to look at: ${failed[0].name} in stage ${failed[0].stage}${failed[0].web_url ? ` (${failed[0].web_url})` : ""}`);
    }
    return lines.join("\n");
}
export async function ciStats(args) {
    const project = gitlabProject(args.project);
    const limit = Math.min(Math.max(Number(args.limit ?? 50) || 50, 5), 100);
    const url = new URL(`${GITLAB}/projects/${project}/pipelines`);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("order_by", "id");
    url.searchParams.set("sort", "desc");
    const pipelines = await getJson(url, gitlabHeaders(), `No project found at ${decodeURIComponent(project)}.`);
    if (!pipelines.length)
        return `No pipelines have run for ${decodeURIComponent(project)}.`;
    const succeeded = pipelines.filter((p) => p.status === "success").length;
    const failed = pipelines.filter((p) => p.status === "failed").length;
    const other = pipelines.length - succeeded - failed;
    const durations = pipelines.map((p) => p.duration).filter((d) => typeof d === "number" && d > 0);
    const average = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
    const byRef = new Map();
    for (const p of pipelines) {
        const ref = p.ref ?? "unknown";
        const entry = byRef.get(ref) ?? { ok: 0, bad: 0 };
        if (p.status === "success")
            entry.ok += 1;
        else if (p.status === "failed")
            entry.bad += 1;
        byRef.set(ref, entry);
    }
    const worst = [...byRef.entries()]
        .filter(([, v]) => v.ok + v.bad >= 2)
        .sort((a, b) => (b[1].bad / (b[1].ok + b[1].bad)) - (a[1].bad / (a[1].ok + a[1].bad)))
        .slice(0, 5);
    const rate = Math.round((succeeded / pipelines.length) * 100);
    const lines = [
        `CI statistics for ${decodeURIComponent(project)} over the last ${pipelines.length} pipeline(s)`,
        "",
        `Success: ${succeeded} (${rate}%) | Failed: ${failed} | Still running or cancelled: ${other}`,
        `Average pipeline duration: ${average != null ? seconds(average) : "not reported"}`,
        "",
    ];
    if (worst.length) {
        lines.push("Success rate per branch:");
        for (const [ref, stats] of worst) {
            lines.push(`  ${Math.round((stats.ok / (stats.ok + stats.bad)) * 100)}%  ${ref} (${stats.ok} ok, ${stats.bad} failed)`);
        }
    }
    else {
        lines.push("Not enough runs per branch to compare them yet.");
    }
    lines.push("", rate >= 90
        ? "The pipeline is reliable."
        : rate >= 70
            ? "Flakiness worth investigating: a meaningful share of runs fail."
            : "The pipeline fails often — fix this before adding more work to it.");
    return lines.join("\n");
}
export async function latestCiStatus(args) {
    const projects = (args.projects ?? []).map((p) => String(p).trim()).filter(Boolean).slice(0, 10);
    if (!projects.length)
        return "Provide up to 10 GitLab projects such as gitlab-org/cli.";
    const rows = [];
    for (const raw of projects) {
        const project = gitlabProject(raw);
        try {
            const url = new URL(`${GITLAB}/projects/${project}/pipelines`);
            url.searchParams.set("per_page", "1");
            url.searchParams.set("order_by", "id");
            url.searchParams.set("sort", "desc");
            const [latest] = await getJson(url, gitlabHeaders(), `No project found at ${decodeURIComponent(project)}.`);
            if (!latest) {
                rows.push(`NO RUNS   ${decodeURIComponent(project)}`);
                continue;
            }
            const age = Math.round((Date.now() - new Date(latest.created_at).getTime()) / 60000);
            const timing = typeof latest.duration === "number" ? ` | ${seconds(latest.duration)}` : "";
            rows.push(`${latest.status.toUpperCase().padEnd(9)} ${decodeURIComponent(project)} — ${latest.ref ?? "unknown"} | ${age < 60 ? `${age} min ago` : `${Math.round(age / 60)}h ago`}${timing}`);
        }
        catch (e) {
            rows.push(`ERROR     ${decodeURIComponent(project)} (${errorMessage(e)})`);
        }
    }
    const green = rows.filter((r) => r.startsWith("SUCCESS")).length;
    return [
        `Latest pipeline status for ${projects.length} project(s): ${green} green`,
        "",
        ...rows,
    ].join("\n");
}
export async function githubWorkflowRuns(args) {
    const repo = githubRepo(args.repo);
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
    const url = new URL(`${GITHUB}/repos/${repo}/actions/runs`);
    url.searchParams.set("per_page", String(limit));
    if (args.branch?.trim())
        url.searchParams.set("branch", args.branch.trim());
    const data = await getJson(url, githubHeaders(), `No repository found at ${repo}.`);
    const runs = data.workflow_runs ?? [];
    const header = `GitHub Actions runs for ${repo}${args.branch ? ` on ${args.branch}` : ""}`;
    if (!runs.length)
        return `${header}\n\nNo workflow runs found.`;
    const lines = [`${header} — ${runs.length} most recent`, ""];
    runs.forEach((run) => {
        const conclusion = run.conclusion ?? run.status;
        const age = Math.round((Date.now() - new Date(run.created_at).getTime()) / 3600000);
        lines.push(`${String(conclusion).padEnd(10)} ${run.name ?? "unnamed workflow"} (${run.event})`);
        lines.push(`   branch ${run.head_branch ?? "unknown"} | attempt ${run.run_attempt ?? 1} | ${age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`} | run ${run.id}`);
    });
    const failed = runs.filter((r) => r.conclusion === "failure").length;
    lines.push("", failed
        ? `${failed} of ${runs.length} recent run(s) failed — use github_jobs with a run id to see which step broke.`
        : "None of these runs failed.");
    return lines.join("\n");
}
export async function githubJobs(args) {
    const repo = githubRepo(args.repo);
    const runId = Number(args.runId);
    if (!Number.isInteger(runId) || runId <= 0)
        return "Provide the numeric workflow run id, for example 1234567890.";
    const data = await getJson(new URL(`${GITHUB}/repos/${repo}/actions/runs/${runId}/jobs`), githubHeaders(), `No workflow run ${runId} in ${repo}.`);
    const jobs = data.jobs ?? [];
    if (!jobs.length)
        return `Workflow run ${runId} has no job records yet.`;
    const lines = [`Jobs for GitHub Actions run ${runId} in ${repo}`, ""];
    for (const job of jobs) {
        const duration = job.started_at && job.completed_at
            ? seconds((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
            : "not finished";
        lines.push(`${String(job.conclusion ?? job.status).padEnd(10)} ${job.name} (${duration})`);
        const failedSteps = (job.steps ?? []).filter((s) => s.conclusion === "failure");
        for (const step of failedSteps)
            lines.push(`   failed step: ${step.name}`);
    }
    const failed = jobs.filter((j) => j.conclusion === "failure");
    if (failed.length)
        lines.push("", `Failing job(s): ${failed.map((j) => j.name).join(", ")}`);
    return lines.join("\n");
}
const notReported = (value) => typeof value === "string" && value.trim() ? value.trim() : "not reported";
const dayOf = (value) => {
    if (typeof value !== "string" || !value.trim())
        return "not reported";
    const stamp = new Date(value).getTime();
    if (!Number.isFinite(stamp))
        return "not reported";
    return new Date(stamp).toISOString().slice(0, 10);
};
// GitLab keeps the changelog in a Markdown blob, so the headline is the first
// line that is not a heading marker, a blank line or a merge commit title.
function changelogHeadline(description) {
    if (typeof description !== "string")
        return "not reported";
    for (const raw of description.split("\n")) {
        const line = raw.replace(/^[#>\s*+-]+/, "").trim();
        if (!line || line.startsWith("|"))
            continue;
        if (/^merge (request|mr) !\d+/i.test(line))
            continue;
        return line.length > 140 ? `${line.slice(0, 140)}...` : line;
    }
    return "not reported";
}
export async function projectReleases(args) {
    const project = gitlabProject(args.project);
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 30);
    const url = new URL(`${GITLAB}/projects/${project}/releases`);
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("order_by", "released_at");
    url.searchParams.set("sort", "desc");
    const releases = await getJson(url, gitlabHeaders(), `No project found at ${decodeURIComponent(project)}.`);
    const header = `Releases of ${decodeURIComponent(project)}`;
    if (!releases.length)
        return `${header}\n\nThis project has published no releases.`;
    const lines = [];
    for (const r of releases) {
        const tag = notReported(r.tag_name);
        const author = r.author?.name?.trim() || r.author?.username?.trim() || "not reported";
        const sources = r.assets?.sources?.length ?? 0;
        const links = r.assets?.links?.length ?? 0;
        const when = dayOf(r.released_at ?? r.created_at);
        const sha = r.commit?.short_id ? ` | ${r.commit.short_id}` : "";
        const state = r.upcoming_release ? " | UPCOMING" : "";
        lines.push(`${tag} — released ${when} by ${author}${sha}${state}`);
        lines.push(`  headline: ${changelogHeadline(r.description)}`);
        if (r.commit?.title?.trim())
            lines.push(`  commit: ${r.commit.title.trim()}`);
        lines.push(`  assets: ${sources} source archive(s), ${links} link(s)`);
    }
    const upcoming = releases.filter((r) => r.upcoming_release).length;
    return [
        `${header} — ${releases.length} release(s), newest first${upcoming ? `, ${upcoming} upcoming` : ""}`,
        "",
        ...lines,
        "",
        "Release dates come from GitLab's own release records, so they say when a tag was cut rather than when the underlying commits were merged.",
    ].join("\n");
}
export async function repoLanguages(args) {
    const repo = githubRepo(args.repo);
    const bytes = await getJson(new URL(`${GITHUB}/repos/${repo}/languages`), githubHeaders(), `No repository found at ${repo}.`);
    const entries = Object.entries(bytes ?? {})
        .filter(([, size]) => typeof size === "number" && size > 0)
        .sort((a, b) => b[1] - a[1]);
    if (!entries.length)
        throw new Error(`GitHub reported no language data for ${repo}.`);
    const total = entries.reduce((sum, [, size]) => sum + size, 0);
    const kb = (size) => (size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(size / 1024)} KB`);
    const width = Math.max(...entries.map(([name]) => name.length));
    const lines = entries.map(([name, size], i) => {
        const share = (size / total) * 100;
        const bar = "#".repeat(Math.max(1, Math.round(share / 2)));
        return `${String(i + 1).padStart(2)}. ${name.padEnd(width)}  ${kb(size).padStart(8)}  ${share.toFixed(1).padStart(5)}%  ${bar}`;
    });
    const [top, second] = entries;
    return [
        `Language breakdown for ${repo} — ${entries.length} language(s), ${kb(total)} of code GitHub detected`,
        "",
        ...lines,
        "",
        `${top[0]} makes up ${((top[1] / total) * 100).toFixed(1)}% of the detected code${second ? `, ahead of ${second[0]} at ${((second[1] / total) * 100).toFixed(1)}%` : ""}.`,
        "These are detected bytes, not lines of code, and generated or vendored files are counted too, so read the split as a rough sense of the stack rather than an exact measure.",
    ].join("\n");
}
