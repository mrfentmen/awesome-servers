import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

class ToolError extends Error {}

const BASE = "https://huggingface.co"
const API = `${BASE}/api`
const TIMEOUT_MS = 25_000
const MAX_FILES = 2_000
const KIND = z.enum(["model", "dataset"])
const SORT = z.enum(["downloads", "likes", "lastModified", "createdAt"]).default("downloads")

type Json = Record<string, unknown>

function object(value: unknown): Json {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Json) : {}
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function string(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function number(value: unknown): number | null {
  return typeof value === "number" ? value : null
}

function boolean(value: unknown): boolean {
  return value === true
}

function strings(value: unknown): string[] {
  return array(value).filter((item): item is string => typeof item === "string")
}

function text(value: unknown): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] }
}

function fail(message: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: message }], isError: true }
}

function errorMessage(error: unknown): string {
  if (error instanceof ToolError || error instanceof Error) return `Error: ${error.message}`
  return `Error: ${String(error)}`
}

function headers(accept: string, token: string | null): Record<string, string> {
  const result: Record<string, string> = {
    "user-agent": "huggingface-hub-mcp/1.0",
    accept,
  }
  if (token) result.authorization = `Bearer ${token}`
  return result
}

function statusError(status: number, body: string): ToolError {
  if (status === 401) return new ToolError("Hugging Face returned 401 (unauthorized); set a valid HF_TOKEN if this repo is private")
  if (status === 403) return new ToolError("this repo is gated or private; set HF_TOKEN and accept its terms on huggingface.co")
  if (status === 404) return new ToolError("not found on Hugging Face")
  if (status === 429) return new ToolError("Hugging Face rate limit reached; set HF_TOKEN or try again later")
  return new ToolError(`Hugging Face API returned ${status}: ${body.slice(0, 200)}`)
}

async function request(url: string, accept = "application/json"): Promise<Response> {
  if (!url.startsWith(`${BASE}/`)) throw new ToolError("refusing to call a URL outside huggingface.co")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const token = process.env.HF_TOKEN?.trim() || null
  try {
    let response = await fetch(url, { headers: headers(accept, token), signal: controller.signal })
    if (response.status === 401 && token) {
      response = await fetch(url, { headers: headers(accept, null), signal: controller.signal })
      if (response.ok) return response
      throw new ToolError("Hugging Face rejected HF_TOKEN; unset it or use a valid token")
    }
    if (!response.ok) throw statusError(response.status, await response.text())
    return response
  } catch (error) {
    if (error instanceof ToolError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw new ToolError(`Hugging Face did not answer within ${TIMEOUT_MS / 1000}s`)
    }
    throw new ToolError(`could not reach Hugging Face: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    clearTimeout(timer)
  }
}

async function json(url: string): Promise<unknown> {
  const response = await request(url)
  try {
    return await response.json()
  } catch {
    throw new ToolError("Hugging Face returned invalid JSON")
  }
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const value = search.toString()
  return value ? `?${value}` : ""
}

function repoPath(repo: string): string {
  return repo.split("/").map(encodeURIComponent).join("/")
}

function checkRepo(input: string): string {
  const repo = input.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*(\/[A-Za-z0-9][A-Za-z0-9_.-]*)?$/.test(repo) || repo.includes("..")) {
    throw new ToolError("repo must look like 'owner/name' or a single model name")
  }
  if (repo.length > 200) throw new ToolError("repo id is too long")
  return repo
}

function checkRevision(input: string): string {
  const revision = input.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(revision) || revision.includes("..")) {
    throw new ToolError("revision must be a branch, tag or commit name")
  }
  return revision
}

function checkPath(input: string): string {
  const value = input.trim().replace(/^\/+|\/+$/g, "")
  if (!value) return ""
  if (value.length > 300) throw new ToolError("path is too long")
  if (value.split("/").some((part) => part === ".." || part === "." || part === "")) {
    throw new ToolError("path must not contain empty, '.' or '..' segments")
  }
  return value
}

function modelSummary(item: unknown): Json {
  const model = object(item)
  return {
    id: string(model.id) ?? string(model.modelId),
    author: string(model.author),
    downloads: number(model.downloads),
    likes: number(model.likes),
    pipeline_tag: string(model.pipeline_tag),
    library_name: string(model.library_name),
    tags: strings(model.tags).slice(0, 20),
    created_at: string(model.createdAt),
    last_modified: string(model.lastModified),
    gated: model.gated === true ? true : string(model.gated),
    private: boolean(model.private),
  }
}

function datasetSummary(item: unknown): Json {
  const dataset = object(item)
  return {
    id: string(dataset.id),
    author: string(dataset.author),
    downloads: number(dataset.downloads),
    likes: number(dataset.likes),
    tags: strings(dataset.tags).slice(0, 20),
    created_at: string(dataset.createdAt),
    last_modified: string(dataset.lastModified),
    gated: dataset.gated === true ? true : string(dataset.gated),
    private: boolean(dataset.private),
  }
}

function files(value: unknown): Json[] {
  return array(value)
    .map((entry) => {
      const file = object(entry)
      return { name: string(file.rfilename), size: number(file.size) }
    })
    .filter((entry) => entry.name !== null)
}

function repoInfo(data: unknown, kind: "model" | "dataset"): Json {
  const repo = object(data)
  const list = files(repo.siblings)
  const safetensors = object(repo.safetensors)
  const card = object(repo.cardData)
  const common: Json = {
    id: string(repo.id),
    author: string(repo.author),
    kind,
    downloads: number(repo.downloads),
    likes: number(repo.likes),
    tags: strings(repo.tags).slice(0, 50),
    created_at: string(repo.createdAt),
    last_modified: string(repo.lastModified),
    gated: repo.gated === true ? true : string(repo.gated),
    private: boolean(repo.private),
    file_count: list.length,
    files: list.slice(0, 300),
    card_data: card,
  }
  if (kind === "model") {
    return {
      ...common,
      pipeline_tag: string(repo.pipeline_tag),
      library_name: string(repo.library_name),
      parameters: number(safetensors.total) ?? number(repo.usedStorage),
      config: object(repo.config),
    }
  }
  const description = string(repo.description)
  return {
    ...common,
    description: description ? description.slice(0, 3_000) : null,
  }
}

function nextLink(header: string | null): string | null {
  if (!header) return null
  const match = /<([^>]+)>;\s*rel="next"/.exec(header)
  return match ? match[1] : null
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "huggingface-hub-mcp", version: "1.0.0" })

  server.tool(
    "search_models",
    "Search Hugging Face models by name, author or task, sorted by downloads or likes.",
    {
      query: z.string().max(200).default("").describe("Words in the model name or description"),
      author: z.string().max(100).default("").describe("Owner, e.g. meta-llama"),
      task: z.string().max(60).regex(/^[a-z0-9-]+$/).or(z.literal("")).default("").describe("Pipeline tag, e.g. text-generation, automatic-speech-recognition"),
      sort: SORT,
      limit: z.number().int().min(1).max(100).default(20),
    },
    async ({ query: search, author, task, sort, limit }) => {
      try {
        const data = await json(`${API}/models${query({ search, author, filter: task, sort, direction: -1, limit })}`)
        if (!Array.isArray(data)) throw new ToolError("unexpected search response from Hugging Face")
        return text({ count: data.length, models: data.map(modelSummary) })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "search_datasets",
    "Search Hugging Face datasets by name or author, sorted by downloads or likes.",
    {
      query: z.string().max(200).default("").describe("Words in the dataset name or description"),
      author: z.string().max(100).default("").describe("Owner, e.g. huggingface"),
      sort: SORT,
      limit: z.number().int().min(1).max(100).default(20),
    },
    async ({ query: search, author, sort, limit }) => {
      try {
        const data = await json(`${API}/datasets${query({ search, author, sort, direction: -1, limit })}`)
        if (!Array.isArray(data)) throw new ToolError("unexpected search response from Hugging Face")
        return text({ count: data.length, datasets: data.map(datasetSummary) })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "model_info",
    "Downloads, likes, tags, parameters, config and the file list for one model.",
    {
      repo: z.string().min(1).max(200).describe("Model id, e.g. bert-base-uncased or meta-llama/Llama-3.1-8B"),
    },
    async ({ repo }) => {
      try {
        const id = checkRepo(repo)
        const data = await json(`${API}/models/${repoPath(id)}?blobs=true`)
        return text(repoInfo(data, "model"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "dataset_info",
    "Downloads, likes, tags, description and the file list for one dataset.",
    {
      repo: z.string().min(1).max(200).describe("Dataset id, e.g. imdb or huggingface/alpaca"),
    },
    async ({ repo }) => {
      try {
        const id = checkRepo(repo)
        const data = await json(`${API}/datasets/${repoPath(id)}`)
        return text(repoInfo(data, "dataset"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "list_files",
    "List every file in a model or dataset repository at a revision, with sizes.",
    {
      repo: z.string().min(1).max(200).describe("Model or dataset id"),
      kind: KIND.default("model"),
      revision: z.string().max(100).default("main").describe("Branch, tag or commit"),
      path: z.string().max(300).default("").describe("Folder inside the repo; empty means the root"),
      limit: z.number().int().min(1).max(MAX_FILES).default(500),
    },
    async ({ repo, kind, revision, path: folder, limit }) => {
      try {
        const id = checkRepo(repo)
        const rev = checkRevision(revision)
        const sub = checkPath(folder)
        const suffix = sub ? `/${sub.split("/").map(encodeURIComponent).join("/")}` : ""
        const collection = kind === "model" ? "models" : "datasets"
        let url: string | null = `${API}/${collection}/${repoPath(id)}/tree/${encodeURIComponent(rev)}${suffix}?recursive=true`
        const entries: Json[] = []
        let pages = 0
        while (url && pages < 5 && entries.length < limit) {
          const response = await request(url)
          const data: unknown = await response.json()
          if (!Array.isArray(data)) throw new ToolError("unexpected file list from Hugging Face")
          for (const entry of data) {
            const file = object(entry)
            const name = string(file.path)
            if (!name) continue
            entries.push({ path: name, type: string(file.type), size: number(file.size), oid: string(file.oid) })
            if (entries.length >= limit) break
          }
          url = nextLink(response.headers.get("link"))
          pages += 1
        }
        return text({ repo: id, kind, revision: rev, path: sub, count: entries.length, truncated: entries.length >= limit, entries })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  server.tool(
    "read_card",
    "Read a model or dataset README (the card) as plain text.",
    {
      repo: z.string().min(1).max(200).describe("Model or dataset id"),
      kind: KIND.default("model"),
      revision: z.string().max(100).default("main").describe("Branch, tag or commit"),
      max_chars: z.number().int().min(1_000).max(50_000).default(20_000).describe("Truncate the card after this many characters"),
    },
    async ({ repo, kind, revision, max_chars }) => {
      try {
        const id = checkRepo(repo)
        const rev = checkRevision(revision)
        const collection = kind === "model" ? "models" : "datasets"
        const prefix = kind === "model" ? "" : "datasets/"
        const url = `${BASE}/${prefix}${repoPath(id)}/raw/${encodeURIComponent(rev)}/README.md`
        const response = await request(url, "text/plain")
        const card = await response.text()
        return text({
          repo: id,
          kind,
          revision: rev,
          chars: card.length,
          truncated: card.length > max_chars,
          text: card.slice(0, max_chars),
        })
      } catch (error) {
        return fail(errorMessage(error))
      }
    }
  )

  return server
}
