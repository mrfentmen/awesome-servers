const UA = 'mrfentmen-greenhouse-mcp/1.0';
const BASE = 'https://boards-api.greenhouse.io/v1/boards';
const clamp = (value, fallback, max = 50) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const plain = (html) => String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const names = (list) => (list ?? []).map((entry) => entry.name).filter(Boolean).join(', ') || 'n/a';
const boardPath = (board) => {
    const value = String(board ?? '').trim();
    if (!value)
        throw new Error('Provide a board token like example.');
    return encodeURIComponent(value);
};
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Greenhouse returned ${res.status}`);
    return (await res.json());
}
const row = (job, index) => `${index + 1}. ${job.title ?? '?'} | ${job.location?.name ?? '?'} | ${names(job.departments)}` +
    ` | id ${job.id ?? '?'} | updated ${String(job.updated_at ?? '?').slice(0, 10)}\n   ${job.absolute_url ?? ''}`;
async function allJobs(board, content = false) {
    const data = await getJson(`/${board}/jobs${content ? '?content=true' : ''}`);
    return data.jobs ?? [];
}
export async function jobs(args) {
    const board = boardPath(args?.board);
    const limit = clamp(args?.limit, 15);
    const list = await allJobs(board);
    if (!list.length)
        return `No Greenhouse jobs for board "${args.board}".`;
    return `Greenhouse jobs for "${args.board}" (${list.length} open, showing ${Math.min(limit, list.length)}):\n` +
        list.slice(0, limit).map(row).join('\n');
}
export async function job(args) {
    const board = boardPath(args?.board);
    const id = Number(args?.job_id);
    if (!Number.isFinite(id) || id <= 0)
        throw new Error('job_id must be a numeric Greenhouse job id.');
    const found = await getJson(`/${board}/jobs/${id}`);
    return `${found.title ?? '?'} at ${found.company_name ?? args.board}\n` +
        `Location: ${found.location?.name ?? '?'}\n` +
        `Departments: ${names(found.departments)}\n` +
        `Offices: ${names(found.offices)}\n` +
        `Job id: ${found.id ?? id} | updated ${String(found.updated_at ?? '?').slice(0, 10)}\n` +
        `${found.absolute_url ?? ''}\n\n` +
        plain(found.content).slice(0, 4000);
}
export async function searchJobs(args) {
    const board = boardPath(args?.board);
    const query = String(args?.query ?? '').trim().toLowerCase();
    if (!query)
        throw new Error('query is required.');
    const limit = clamp(args?.limit, 15);
    const list = await allJobs(board);
    const hits = list.filter((entry) => `${entry.title ?? ''} ${entry.location?.name ?? ''} ${names(entry.departments)} ${names(entry.offices)}`
        .toLowerCase()
        .includes(query));
    if (!hits.length)
        return `No jobs on board "${args.board}" match "${args.query}" (searched ${list.length}).`;
    return `Greenhouse jobs on "${args.board}" matching "${args.query}" (${hits.length} of ${list.length}):\n` +
        hits.slice(0, limit).map(row).join('\n');
}
export async function departments(args) {
    const board = boardPath(args?.board);
    const list = await getJson(`/${board}/departments`);
    const all = list.departments ?? [];
    if (!all.length)
        return `No Greenhouse departments for board "${args.board}".`;
    const ranked = all
        .map((entry) => ({ name: entry.name ?? '?', count: entry.jobs?.length ?? 0 }))
        .sort((a, b) => b.count - a.count);
    const hiring = ranked.filter((entry) => entry.count > 0);
    return `Greenhouse departments for "${args.board}" (${all.length} total, ${hiring.length} with open roles):\n` +
        ranked.slice(0, 25).map((entry, i) => `${i + 1}. ${entry.name} - ${entry.count} job(s)`).join('\n');
}
export async function offices(args) {
    const board = boardPath(args?.board);
    const list = await getJson(`/${board}/offices`);
    const all = list.offices ?? [];
    if (!all.length)
        return `No Greenhouse offices for board "${args.board}".`;
    return `Greenhouse offices for "${args.board}" (${all.length}):\n` +
        all.slice(0, 40).map((entry, i) => `${i + 1}. ${entry.name ?? '?'} | ${entry.location ?? '?'} | ${(entry.departments ?? []).length} department(s)`).join('\n');
}
export async function board(args) {
    const path = boardPath(args?.board);
    const found = await getJson(`/${path}`);
    const jobsCount = (await allJobs(path)).length;
    return `Board: ${found.name ?? args.board} (${args.board})\n${jobsCount} open job(s)\n\n${plain(found.content).slice(0, 2000)}`;
}
const ageRow = (job, index) => `${index + 1}. ${job.title ?? '?'} | ${job.location?.name ?? '?'} | ${names(job.departments)} | id ${job.id ?? '?'}` +
    ` | first published ${String(job.first_published ?? '?').slice(0, 10)} | updated ${String(job.updated_at ?? '?').slice(0, 10)}\n   ${job.absolute_url ?? ''}`;
/** Open roles attached to one office (or matching it in the location string). */
export async function jobsByOffice(args) {
    const board = boardPath(args?.board);
    const needle = String(args?.office ?? '').trim().toLowerCase();
    if (!needle)
        throw new Error('office is required.');
    const limit = clamp(args?.limit, 15);
    const list = await allJobs(board);
    const hits = list.filter((entry) => (entry.offices ?? []).some((office) => String(office.name ?? '').toLowerCase().includes(needle)) ||
        String(entry.location?.name ?? '').toLowerCase().includes(needle));
    if (!hits.length) {
        const known = [...new Set(list.flatMap((entry) => (entry.offices ?? []).map((office) => String(office.name ?? ''))).filter(Boolean))];
        return `No jobs on "${args.board}" at an office matching "${args.office}" (${list.length} open). ` +
            `Offices on this board: ${known.slice(0, 20).join(', ') || 'none listed'}.`;
    }
    return `Greenhouse jobs on "${args.board}" at offices matching "${args.office}" (${hits.length} of ${list.length}):\n` +
        hits.slice(0, limit).map(row).join('\n');
}
/** The most recently opened roles on a board, newest first. */
export async function newestJobs(args) {
    const board = boardPath(args?.board);
    const limit = clamp(args?.limit, 15);
    const list = await allJobs(board);
    if (!list.length)
        return `No Greenhouse jobs for board "${args.board}".`;
    const sorted = [...list].sort((a, b) => String(b.first_published ?? b.updated_at ?? '').localeCompare(String(a.first_published ?? a.updated_at ?? '')));
    return `Newest Greenhouse jobs on "${args.board}" (${list.length} open, sorted by first published):\n` +
        sorted.slice(0, limit).map(ageRow).join('\n');
}
/** The real application form for one posting: questions, required flags and deadline. */
export async function jobQuestions(args) {
    const board = boardPath(args?.board);
    const id = Number(args?.job_id);
    if (!Number.isFinite(id) || id <= 0)
        throw new Error('job_id must be a numeric Greenhouse job id.');
    const found = await getJson(`/${board}/jobs/${id}?questions=true`);
    const questions = found.questions ?? [];
    if (!questions.length) {
        return `"${found.title ?? id}" on "${args.board}" publishes no application questions (Greenhouse boards may hide them).`;
    }
    const required = questions.filter((question) => question.required === true).length;
    const kind = (question) => (question.fields ?? []).map((field) => field.type ?? field.name ?? 'field').join(', ') || 'free text';
    // Upstream labels sometimes carry trailing newlines, so flatten them.
    const label = (question) => String(question.label ?? '(unlabelled)').replace(/\s+/g, ' ').trim();
    const lines = questions.map((question, i) => `${i + 1}. ${label(question)}${question.required ? ' — required' : ' — optional'}\n   ${kind(question)}`);
    const extras = [
        found.location_questions?.length ? `Location questions: ${found.location_questions.length}` : '',
        found.demographic_questions?.questions?.length
            ? `Demographic questions: ${found.demographic_questions.questions.length} (voluntary, anonymised)`
            : '',
        found.education ? `Education requirement: ${found.education}` : '',
        found.application_deadline ? `Deadline: ${String(found.application_deadline).slice(0, 10)}` : 'Deadline: none published',
        found.language ? `Posting language: ${found.language}` : '',
        found.metadata?.length
            ? `Metadata: ${found.metadata.map((entry) => `${entry.name ?? '?'} = ${Array.isArray(entry.value) ? entry.value.join(' / ') : entry.value ?? '?'}`).join(' | ')}`
            : '',
    ].filter(Boolean);
    return `Application form for "${found.title ?? id}" on "${args.board}" (${questions.length} questions, ${required} required):\n` +
        lines.join('\n') +
        (extras.length ? `\n\n${extras.join('\n')}` : '');
}
// ---- muxG tools:
const ASHBY_API = 'https://api.ashbyhq.com/posting-api/job-board';
const ageInDays = (iso) => {
    if (typeof iso !== 'string')
        return null;
    const at = Date.parse(iso);
    if (!Number.isFinite(at))
        return null;
    return Math.round((Date.now() - at) / 86_400_000);
};
const median = (values) => {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};
/** How fast a board is hiring: how many roles are new, and how old the backlog is. */
export async function hiringVelocity(args) {
    const board = boardPath(args?.board);
    const window = clamp(args?.days, 30, 365);
    const limit = clamp(args?.limit, 10, 30);
    const list = await allJobs(board, true);
    if (!list.length)
        return `Greenhouse board "${args.board}" publishes no jobs.`;
    const ages = list
        .map((entry) => ({ job: entry, days: ageInDays(entry.first_published) }))
        .filter((item) => item.days !== null);
    if (!ages.length)
        return `No job on board "${args.board}" carries a first_published date, so velocity cannot be computed.`;
    const fresh = ages.filter((item) => item.days <= window);
    const mid = median(ages.map((item) => item.days));
    const lines = [
        `Hiring velocity on Greenhouse board "${args.board}": ${list.length} open role(s), ${ages.length} with a first-published date`,
        `Published in the last ${window} day(s): ${fresh.length} (${((fresh.length / ages.length) * 100).toFixed(1)}% of dated roles)`,
        `Median age of an open role: ${mid ?? 'not reported'} day(s) · newest ${Math.min(...ages.map((i) => i.days))}d · oldest ${Math.max(...ages.map((i) => i.days))}d`,
        '',
    ];
    for (const [i, item] of [...fresh].sort((a, b) => a.days - b.days).slice(0, limit).entries()) {
        lines.push(`  ${i + 1}. ${item.job.title ?? '?'} | ${item.job.location?.name ?? '?'} | ${names(item.job.departments)} | opened ${item.days} day(s) ago`);
    }
    if (fresh.length > limit)
        lines.push(`  ...and ${fresh.length - limit} more role(s) opened inside the window.`);
    if (!fresh.length)
        lines.push('  Nothing opened inside the window.');
    return lines.join('\n');
}
/** A role on a company that hires through Ashby, which publishes its salary band. */
export async function ashbyPosting(args) {
    const company = String(args?.company ?? '').trim();
    if (!company)
        throw new Error('Provide an Ashby job board name, e.g. Ramp.');
    const query = String(args?.query ?? '').trim().toLowerCase();
    if (!query)
        throw new Error('query is required.');
    const limit = clamp(args?.limit, 5, 20);
    const res = await fetch(`${ASHBY_API}/${encodeURIComponent(company)}?includeCompensation=true`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`Ashby has no job board called "${company}".`);
    if (!res.ok)
        throw new Error(`Ashby returned ${res.status}`);
    const board = (await res.json());
    const jobs = Array.isArray(board.jobs) ? board.jobs : [];
    if (!jobs.length)
        return `The Ashby board "${company}" publishes no open roles.`;
    const hits = jobs.filter((entry) => `${entry.title ?? ''} ${entry.team ?? ''} ${entry.department ?? ''}`.toLowerCase().includes(query));
    if (!hits.length)
        return `No role on the Ashby board "${company}" matches "${args.query}" (searched ${jobs.length}).`;
    const lines = [`Ashby postings on "${company}" matching "${args.query}" (${hits.length} of ${jobs.length}):`];
    for (const [i, entry] of hits.slice(0, limit).entries()) {
        const days = ageInDays(entry.publishedAt);
        lines.push(`  ${i + 1}. ${entry.title ?? '?'} | ${entry.team ?? '?'} | ${entry.location ?? '?'}${entry.isRemote ? ' (remote)' : ''}`);
        lines.push(`     ${entry.employmentType ?? 'type not reported'} · ${entry.workplaceType ?? 'workplace not reported'} · published ${days !== null ? `${days} day(s) ago` : 'date not reported'}`);
        const components = (entry.compensation?.summaryComponents ?? []).filter((part) => part.minValue !== null && part.minValue !== undefined);
        if (components.length) {
            for (const part of components) {
                const low = part.minValue ?? 0;
                const high = part.maxValue ?? low;
                const unit = part.interval && part.interval !== 'NONE' ? ` per ${part.interval.toLowerCase().replace('1 ', '')}` : '';
                const currency = part.currencyCode ?? 'currency not reported';
                lines.push(`     ${part.compensationType ?? 'component'}: ${low.toLocaleString('en-US')} - ${high.toLocaleString('en-US')} ${currency}${unit}`);
            }
        }
        else {
            lines.push('     compensation: not published on this posting');
        }
        if (entry.jobUrl)
            lines.push(`     ${entry.jobUrl}`);
    }
    return lines.join('\n');
}
