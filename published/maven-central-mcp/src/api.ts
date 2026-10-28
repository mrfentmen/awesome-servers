const BASE = "https://search.maven.org/solrsearch/select"

export class MavenError extends Error {}

// search.maven.org is slow on cold queries (30s is routine), so allow a long timeout
// and one retry before reporting failure.
async function getJson(params: Record<string, string>, timeoutMs = 60000): Promise<any> {
  const url = `${BASE}?${new URLSearchParams(params).toString()}`
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "user-agent": "maven-central-mcp", accept: "application/json" },
      })
      if (!res.ok) throw new MavenError(`search.maven.org responded ${res.status}`)
      return await res.json()
    } catch (e) {
      if (e instanceof MavenError && !String(e.message).includes("timed out")) throw e
      lastError = e
      if ((e as Error).name === "AbortError") lastError = new MavenError("search.maven.org request timed out")
    } finally {
      clearTimeout(timer)
    }
  }
  if (lastError instanceof MavenError) throw lastError
  throw new MavenError(`search.maven.org request failed: ${(lastError as Error)?.message ?? "unknown error"}`)
}

export function coords(groupId: string, artifactId: string): { g: string; a: string } {
  const g = groupId.trim()
  const a = artifactId.trim()
  if (!/^[A-Za-z0-9_.-]+$/.test(g)) throw new MavenError(`"${groupId}" is not a valid groupId`)
  if (!/^[A-Za-z0-9_.-]+$/.test(a)) throw new MavenError(`"${artifactId}" is not a valid artifactId`)
  return { g, a }
}

function when(ms?: number): string {
  if (!ms) return "unknown"
  return new Date(ms).toISOString().slice(0, 10)
}

export async function searchArtifacts(query: string, limit: number): Promise<string> {
  const d = await getJson({ q: query, rows: String(limit), wt: "json" })
  const docs: any[] = d.response?.docs ?? []
  if (docs.length === 0) return `No Maven artifacts matched "${query}".`
  const lines = docs.map(
    (x, i) =>
      `${i + 1}. ${x.g}:${x.a}:${x.latestVersion ?? "?"} — ${x.packaging ?? "jar"}, updated ${when(x.timestamp)}${x.versionCount ? `, ${x.versionCount} versions` : ""}`
  )
  return `Maven Central matches for "${query}" (${d.response?.numFound ?? docs.length} found):\n\n${lines.join("\n")}`
}

export async function artifactVersions(groupId: string, artifactId: string, limit: number): Promise<string> {
  const { g, a } = coords(groupId, artifactId)
  const d = await getJson({ q: `g:${g} AND a:${a}`, core: "gav", rows: String(limit), wt: "json" })
  const docs: any[] = d.response?.docs ?? []
  if (docs.length === 0) throw new MavenError(`No versions found for ${g}:${a}`)
  const lines = docs.map((v, i) => `${i + 1}. ${v.v} — ${when(v.timestamp)}`)
  return `${g}:${a} — newest ${docs.length} of ${d.response?.numFound ?? docs.length} versions:\n\n${lines.join("\n")}`
}

export async function latestVersion(groupId: string, artifactId: string): Promise<string> {
  const { g, a } = coords(groupId, artifactId)
  const d = await getJson({ q: `g:${g} AND a:${a}`, rows: "1", wt: "json" })
  const doc = d.response?.docs?.[0]
  if (!doc) throw new MavenError(`No artifact named ${g}:${a}`)
  return [
    `Artifact: ${doc.g}:${doc.a}`,
    `Latest version: ${doc.latestVersion ?? "unknown"}`,
    `Versions published: ${doc.versionCount ?? "?"}`,
    `Last update: ${when(doc.timestamp)}`,
    `Packaging: ${doc.packaging ?? "jar"}`,
  ].join("\n")
}

export async function groupArtifacts(groupId: string, limit: number): Promise<string> {
  const g = groupId.trim()
  if (!/^[A-Za-z0-9_.-]+$/.test(g)) throw new MavenError(`"${groupId}" is not a valid groupId`)
  const d = await getJson({ q: `g:${g}`, rows: String(limit), wt: "json" })
  const docs: any[] = d.response?.docs ?? []
  if (docs.length === 0) throw new MavenError(`No artifacts found for groupId ${g}`)
  const lines = docs.map(
    (x, i) => `${i + 1}. ${x.a} ${x.latestVersion ?? ""} — updated ${when(x.timestamp)}`
  )
  return `${g} — ${d.response?.numFound ?? docs.length} artifacts:\n\n${lines.join("\n")}`
}

export async function searchByClass(className: string, limit: number): Promise<string> {
  const c = className.trim()
  if (!/^[A-Za-z0-9_.$]+$/.test(c)) throw new MavenError(`"${className}" is not a valid class name`)
  const d = await getJson({ q: `fc:${c}`, rows: String(limit), wt: "json" })
  const docs: any[] = d.response?.docs ?? []
  if (docs.length === 0) return `No artifact publishes a class matching "${className}".`
  const lines = docs.map((x, i) => `${i + 1}. ${x.g}:${x.a} ${x.latestVersion ?? ""}`)
  return `Artifacts containing class "${className}":\n\n${lines.join("\n")}`
}

export async function dependencySnippet(
  groupId: string,
  artifactId: string,
  version?: string
): Promise<string> {
  const { g, a } = coords(groupId, artifactId)
  let v = version?.trim()
  if (v && !/^[A-Za-z0-9_.+-]+$/.test(v)) throw new MavenError(`"${version}" is not a valid version`)
  if (!v) {
    const d = await getJson({ q: `g:${g} AND a:${a}`, rows: "1", wt: "json", fl: "latestVersion" })
    v = d.response?.docs?.[0]?.latestVersion
    if (!v) throw new MavenError(`No artifact named ${g}:${a}`)
  }
  const xml = `    <dependency>\n      <groupId>${g}</groupId>\n      <artifactId>${a}</artifactId>\n      <version>${v}</version>\n    </dependency>`
  const gradle = `implementation("${g}:${a}:${v}")`
  return [`Maven dependency for ${g}:${a}:${v}`, "", "pom.xml:", xml, "", "build.gradle:", gradle].join("\n")
}
