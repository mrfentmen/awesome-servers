const UA = 'mrfentmen-greenhouse-mcp/1.0';
const BASE = 'https://boards-api.greenhouse.io/v1/boards';

export interface JobsArgs {
  board: string;
  limit?: number;
}

export interface JobArgs {
  board: string;
  job_id: number;
}

export interface SearchJobsArgs {
  board: string;
  query: string;
  limit?: number;
}

export interface BoardArgs {
  board: string;
}

interface RawJob {
  id?: number;
  title?: string;
  absolute_url?: string;
  updated_at?: string;
  first_published?: string;
  requisition_id?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
  offices?: Array<{ name?: string }>;
  content?: string;
}

interface RawDepartment {
  name?: string;
  jobs?: Array<{ title?: string; id?: number }>;
}

interface RawOffice {
  name?: string;
  location?: string;
  departments?: Array<{ name?: string }>;
}

const clamp = (value: number | undefined, fallback: number, max = 50) =>
  Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);

const plain = (html?: string) =>
  String(html ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const names = (list?: Array<{ name?: string }>) =>
  (list ?? []).map((entry) => entry.name).filter(Boolean).join(', ') || 'n/a';

const boardPath = (board?: string) => {
  const value = String(board ?? '').trim();
  if (!value) throw new Error('Provide a board token like example.');
  return encodeURIComponent(value);
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Greenhouse returned ${res.status}`);
  return (await res.json()) as T;
}

const row = (job: RawJob, index: number) =>
  `${index + 1}. ${job.title ?? '?'} | ${job.location?.name ?? '?'} | ${names(job.departments)}` +
  ` | id ${job.id ?? '?'} | updated ${String(job.updated_at ?? '?').slice(0, 10)}\n   ${job.absolute_url ?? ''}`;

async function allJobs(board: string, content = false): Promise<RawJob[]> {
  const data = await getJson<{ jobs?: RawJob[] }>(`/${board}/jobs${content ? '?content=true' : ''}`);
  return data.jobs ?? [];
}

export async function jobs(args: JobsArgs): Promise<string> {
  const board = boardPath(args?.board);
  const limit = clamp(args?.limit, 15);
  const list = await allJobs(board);
  if (!list.length) return `No Greenhouse jobs for board "${args.board}".`;
  return `Greenhouse jobs for "${args.board}" (${list.length} open, showing ${Math.min(limit, list.length)}):\n` +
    list.slice(0, limit).map(row).join('\n');
}

export async function job(args: JobArgs): Promise<string> {
  const board = boardPath(args?.board);
  const id = Number(args?.job_id);
  if (!Number.isFinite(id) || id <= 0) throw new Error('job_id must be a numeric Greenhouse job id.');
  const found = await getJson<RawJob & { company_name?: string }>(`/${board}/jobs/${id}`);
  return `${found.title ?? '?'} at ${found.company_name ?? args.board}\n` +
    `Location: ${found.location?.name ?? '?'}\n` +
    `Departments: ${names(found.departments)}\n` +
    `Offices: ${names(found.offices)}\n` +
    `Job id: ${found.id ?? id} | updated ${String(found.updated_at ?? '?').slice(0, 10)}\n` +
    `${found.absolute_url ?? ''}\n\n` +
    plain(found.content).slice(0, 4000);
}

export async function searchJobs(args: SearchJobsArgs): Promise<string> {
  const board = boardPath(args?.board);
  const query = String(args?.query ?? '').trim().toLowerCase();
  if (!query) throw new Error('query is required.');
  const limit = clamp(args?.limit, 15);
  const list = await allJobs(board);
  const hits = list.filter((entry) =>
    `${entry.title ?? ''} ${entry.location?.name ?? ''} ${names(entry.departments)} ${names(entry.offices)}`
      .toLowerCase()
      .includes(query));
  if (!hits.length) return `No jobs on board "${args.board}" match "${args.query}" (searched ${list.length}).`;
  return `Greenhouse jobs on "${args.board}" matching "${args.query}" (${hits.length} of ${list.length}):\n` +
    hits.slice(0, limit).map(row).join('\n');
}

export async function departments(args: BoardArgs): Promise<string> {
  const board = boardPath(args?.board);
  const list = await getJson<{ departments?: RawDepartment[] }>(`/${board}/departments`);
  const all = list.departments ?? [];
  if (!all.length) return `No Greenhouse departments for board "${args.board}".`;
  const ranked = all
    .map((entry) => ({ name: entry.name ?? '?', count: entry.jobs?.length ?? 0 }))
    .sort((a, b) => b.count - a.count);
  const hiring = ranked.filter((entry) => entry.count > 0);
  return `Greenhouse departments for "${args.board}" (${all.length} total, ${hiring.length} with open roles):\n` +
    ranked.slice(0, 25).map((entry, i) => `${i + 1}. ${entry.name} - ${entry.count} job(s)`).join('\n');
}

export async function offices(args: BoardArgs): Promise<string> {
  const board = boardPath(args?.board);
  const list = await getJson<{ offices?: RawOffice[] }>(`/${board}/offices`);
  const all = list.offices ?? [];
  if (!all.length) return `No Greenhouse offices for board "${args.board}".`;
  return `Greenhouse offices for "${args.board}" (${all.length}):\n` +
    all.slice(0, 40).map((entry, i) =>
      `${i + 1}. ${entry.name ?? '?'} | ${entry.location ?? '?'} | ${(entry.departments ?? []).length} department(s)`
    ).join('\n');
}

export async function board(args: BoardArgs): Promise<string> {
  const path = boardPath(args?.board);
  const found = await getJson<{ name?: string; content?: string }>(`/${path}`);
  const jobsCount = (await allJobs(path)).length;
  return `Board: ${found.name ?? args.board} (${args.board})\n${jobsCount} open job(s)\n\n${plain(found.content).slice(0, 2000)}`;
}

// ---- batch-2 tools: extra live-data tools (2026-09-26) ----
export interface JobsByOfficeArgs {
  board: string;
  office: string;
  limit?: number;
}

const ageRow = (job: RawJob, index: number) =>
  `${index + 1}. ${job.title ?? '?'} | ${job.location?.name ?? '?'} | ${names(job.departments)} | id ${job.id ?? '?'}` +
  ` | first published ${String(job.first_published ?? '?').slice(0, 10)} | updated ${String(job.updated_at ?? '?').slice(0, 10)}\n   ${job.absolute_url ?? ''}`;

/** Open roles attached to one office (or matching it in the location string). */
export async function jobsByOffice(args: JobsByOfficeArgs): Promise<string> {
  const board = boardPath(args?.board);
  const needle = String(args?.office ?? '').trim().toLowerCase();
  if (!needle) throw new Error('office is required.');
  const limit = clamp(args?.limit, 15);
  const list = await allJobs(board);
  const hits = list.filter((entry) =>
    (entry.offices ?? []).some((office) => String(office.name ?? '').toLowerCase().includes(needle)) ||
    String(entry.location?.name ?? '').toLowerCase().includes(needle));
  if (!hits.length) {
    const known = [...new Set(list.flatMap((entry) => (entry.offices ?? []).map((office) => String(office.name ?? ''))).filter(Boolean))];
    return `No jobs on "${args.board}" at an office matching "${args.office}" (${list.length} open). ` +
      `Offices on this board: ${known.slice(0, 20).join(', ') || 'none listed'}.`;
  }
  return `Greenhouse jobs on "${args.board}" at offices matching "${args.office}" (${hits.length} of ${list.length}):\n` +
    hits.slice(0, limit).map(row).join('\n');
}

export interface NewestArgs {
  board: string;
  limit?: number;
}

/** The most recently opened roles on a board, newest first. */
export async function newestJobs(args: NewestArgs): Promise<string> {
  const board = boardPath(args?.board);
  const limit = clamp(args?.limit, 15);
  const list = await allJobs(board);
  if (!list.length) return `No Greenhouse jobs for board "${args.board}".`;
  const sorted = [...list].sort((a, b) =>
    String(b.first_published ?? b.updated_at ?? '').localeCompare(String(a.first_published ?? a.updated_at ?? '')));
  return `Newest Greenhouse jobs on "${args.board}" (${list.length} open, sorted by first published):\n` +
    sorted.slice(0, limit).map(ageRow).join('\n');
}

interface Question {
  label?: string;
  required?: boolean;
  fields?: Array<{ type?: string; name?: string }>;
}

export interface QuestionsArgs {
  board: string;
  job_id: number;
}

/** The real application form for one posting: questions, required flags and deadline. */
export async function jobQuestions(args: QuestionsArgs): Promise<string> {
  const board = boardPath(args?.board);
  const id = Number(args?.job_id);
  if (!Number.isFinite(id) || id <= 0) throw new Error('job_id must be a numeric Greenhouse job id.');
  const found = await getJson<RawJob & {
    questions?: Question[];
    location_questions?: Question[];
    demographic_questions?: { questions?: Question[] };
    education?: string;
    application_deadline?: string | null;
    language?: string;
    metadata?: Array<{ name?: string; value?: string | string[] | null }>;
  }>(`/${board}/jobs/${id}?questions=true`);

  const questions = found.questions ?? [];
  if (!questions.length) {
    return `"${found.title ?? id}" on "${args.board}" publishes no application questions (Greenhouse boards may hide them).`;
  }
  const required = questions.filter((question) => question.required === true).length;
  const kind = (question: Question) =>
    (question.fields ?? []).map((field) => field.type ?? field.name ?? 'field').join(', ') || 'free text';
  // Upstream labels sometimes carry trailing newlines, so flatten them.
  const label = (question: Question) => String(question.label ?? '(unlabelled)').replace(/\s+/g, ' ').trim();
  const lines = questions.map((question, i) =>
    `${i + 1}. ${label(question)}${question.required ? ' — required' : ' — optional'}\n   ${kind(question)}`);
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
