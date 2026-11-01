/**
 * CloudConvert API v2 client.
 *
 * Files are processed through jobs. A job is a list of tasks:
 * import/url -> convert -> export/url. Every call needs a bearer token.
 */
const LIVE = "https://api.cloudconvert.com/v2"
const SANDBOX = "https://sandbox.api.cloudconvert.com/v2"

export class CcError extends Error {}

export interface Account {
  id: number
  username: string
  email: string
  credits: number
  created_at: string
}

export interface Task {
  id: string
  name: string
  status: string
  operation: string
  message?: string | null
  percent?: number
  result?: {
    files?: Array<{ filename?: string; url?: string; size?: number }>
    [key: string]: unknown
  }
}

export interface Job {
  id: string
  status: string
  tag?: string | null
  created_at: string
  started_at?: string | null
  ended_at?: string | null
  tasks?: Task[]
}

export interface Format {
  input_format: string
  output_format: string
  engine?: string
  engine_version?: string
}

function baseUrl(): string {
  return process.env.CLOUDCONVERT_SANDBOX === "1" ? SANDBOX : LIVE
}

function token(): string {
  const value = process.env.CLOUDCONVERT_API_KEY
  if (!value) throw new CcError("Missing CLOUDCONVERT_API_KEY environment variable")
  return value
}

function extractError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string }
    return parsed.message ?? parsed.error ?? body.slice(0, 200)
  } catch {
    return body.slice(0, 200)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(30000),
  })
  const body = await res.text()
  if (!res.ok) throw new CcError(`CloudConvert error ${res.status}: ${extractError(body)}`)
  return (body ? JSON.parse(body) : {}) as T
}

export async function getAccount(): Promise<Account> {
  const data = await request<{ data: Account }>("/users/me")
  return data.data
}

export async function listFormats(inputFormat?: string): Promise<Format[]> {
  const data = await request<{ data: Format[] }>("/convert/formats")
  const all = data.data ?? []
  if (!inputFormat) return all
  const wanted = inputFormat.toLowerCase()
  return all.filter((f) => f.input_format?.toLowerCase() === wanted)
}

export async function listJobs(status?: string, perPage?: number): Promise<Job[]> {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (perPage) params.set("per_page", String(perPage))
  const query = params.toString()
  const data = await request<{ data: Job[] }>(`/jobs${query ? `?${query}` : ""}`)
  return data.data ?? []
}

export interface CreateJobInput {
  tasks: Array<Record<string, unknown>>
  tag?: string
  redirectUrl?: string
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const body: Record<string, unknown> = { tasks: input.tasks }
  if (input.tag) body.tag = input.tag
  if (input.redirectUrl) body.redirect_url = input.redirectUrl
  const data = await request<{ data: Job }>("/jobs", { method: "POST", body: JSON.stringify(body) })
  return data.data
}

export async function getJob(jobId: string): Promise<Job> {
  const data = await request<{ data: Job }>(`/jobs/${encodeURIComponent(jobId)}`)
  return data.data
}

export async function cancelJob(jobId: string): Promise<Job> {
  const data = await request<{ data: Job }>(`/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" })
  return data.data
}

export async function listJobTasks(jobId: string): Promise<Task[]> {
  const data = await request<{ data: Task[] }>(`/jobs/${encodeURIComponent(jobId)}/tasks`)
  return data.data ?? []
}

export async function getTask(taskId: string): Promise<Task> {
  const data = await request<{ data: Task }>(`/tasks/${encodeURIComponent(taskId)}`)
  return data.data
}

export async function waitTask(taskId: string): Promise<Task> {
  const data = await request<{ data: Task }>(`/tasks/${encodeURIComponent(taskId)}/wait`)
  return data.data
}

export async function cancelTask(taskId: string): Promise<Task> {
  const data = await request<{ data: Task }>(`/tasks/${encodeURIComponent(taskId)}/cancel`, { method: "POST" })
  return data.data
}

export interface ConvertInput {
  inputFormat: string
  outputFormat: string
  input: string
  filename?: string
  options?: Record<string, unknown>
}

export async function convertFile(input: ConvertInput): Promise<Job> {
  const body: Record<string, unknown> = {
    inputformat: input.inputFormat,
    outputformat: input.outputFormat,
    input: input.input,
  }
  if (input.filename) body.filename = input.filename
  if (input.options) body.options = input.options
  const data = await request<{ data: Job }>("/convert", { method: "POST", body: JSON.stringify(body) })
  return data.data
}

export function formatAccount(a: Account): string {
  return [
    `Account ${a.username} (#${a.id})`,
    a.email ? `Email: ${a.email}` : "",
    `Credits: ${a.credits}`,
    a.created_at ? `Created: ${a.created_at}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatJob(job: Job, index?: number): string {
  const lines = [
    `${index !== undefined ? `${index + 1}. ` : ""}Job ${job.id}`,
    `Status: ${job.status}${job.tag ? `  Tag: ${job.tag}` : ""}`,
    `Created: ${job.created_at}`,
  ]
  if (job.tasks && job.tasks.length > 0) {
    lines.push(
      "Tasks:\n" +
        job.tasks
          .map((t) => `  - ${t.name} (${t.operation}) ${t.status}${t.percent !== undefined ? ` ${t.percent}%` : ""}`)
          .join("\n")
    )
  }
  return lines.join("\n")
}

export function formatTask(task: Task): string {
  const lines = [
    `Task ${task.id} — ${task.name}`,
    `Operation: ${task.operation}`,
    `Status: ${task.status}${task.percent !== undefined ? ` (${task.percent}%)` : ""}`,
  ]
  if (task.message) lines.push(`Message: ${task.message}`)
  for (const file of task.result?.files ?? []) {
    const size = typeof file.size === "number" ? ` (${file.size} bytes)` : ""
    lines.push(`File: ${file.filename ?? "unnamed"}${size}`)
    if (file.url) lines.push(`URL: ${file.url}`)
  }
  return lines.join("\n")
}

export function formatFormatList(formats: Format[], limit = 40): string {
  if (formats.length === 0) return "No formats matched."
  const shown = formats.slice(0, limit)
  const lines = shown.map((f) => `${f.input_format} -> ${f.output_format}${f.engine ? ` (${f.engine})` : ""}`)
  const extra = formats.length > shown.length ? `\n...and ${formats.length - shown.length} more` : ""
  return `${formats.length} conversion(s) available:\n${lines.join("\n")}${extra}`
}
