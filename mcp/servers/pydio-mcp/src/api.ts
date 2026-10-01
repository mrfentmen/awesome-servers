export class PydioError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PydioError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function base(): string {
  if (!process.env.PYDIO_BASE_URL) throw new PydioError("Set the PYDIO_BASE_URL environment variable (your Pydio Cells server).")
  return process.env.PYDIO_BASE_URL.replace(/\/$/, "")
}

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new PydioError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function treeStats(nodePaths: string[]): Promise<string> {
  const res = await fetch(base() + "/a/tree/stats", {
    method: "POST",
    headers: { ...UA, Authorization: "Bearer " + envStrict("PYDIO_ACCESS_TOKEN"), "Content-Type": "application/json" },
    body: JSON.stringify({ NodePaths: nodePaths }),
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new PydioError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listWorkspaces(): Promise<string> {
  return treeStats(["/*"])
}

export function getTreeStats(nodePaths: string): Promise<string> {
  const paths = nodePaths.split(",").map((p) => p.trim()).filter(Boolean)
  if (!paths.length) throw new PydioError("Provide at least one node path.")
  return treeStats(paths)
}
