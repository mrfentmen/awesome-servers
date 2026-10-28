import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatVulnerability, getVulnerability, OsvError, queryBatch, queryPackage } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "osv-mcp", version: "1.0.0" })
  server.tool("check_package", "Check a package and optional version for known open source vulnerabilities.", {
    ecosystem: z.string().min(1).describe("OSV ecosystem, for example npm, PyPI, Go, crates.io, Maven, or NuGet"),
    name: z.string().min(1).describe("Package name"),
    version: z.string().optional().describe("Exact installed version, if known"),
  }, async ({ ecosystem, name, version }) => {
    try {
      const result = await queryPackage({ ecosystem, name, version })
      if (!result.vulns.length) return text(`No known OSV vulnerabilities found for ${ecosystem}/${name}${version ? `@${version}` : ""}.`)
      return text(`${ecosystem}/${name}${version ? `@${version}` : ""} has ${result.vulns.length} known vulnerability record(s):\n\n${result.vulns.map(formatVulnerability).join("\n\n")}`)
    } catch (e) { return text(error(e)) }
  })
  server.tool("scan_packages", "Scan several package references in one OSV request. Pass a JSON array of ecosystem, name, and optional version.", {
    packages: z.array(z.object({ ecosystem: z.string().min(1), name: z.string().min(1), version: z.string().optional() })).min(1).max(100),
  }, async ({ packages }) => {
    try {
      const results = await queryBatch(packages)
      const vulnerable = results.filter((r) => r.vulns.length)
      if (!vulnerable.length) return text(`No known vulnerabilities found across ${packages.length} package(s).`)
      return text(vulnerable.map((r) => `${r.ref.ecosystem}/${r.ref.name}${r.ref.version ? `@${r.ref.version}` : ""}: ${r.vulns.length} record(s)\n${r.vulns.map(formatVulnerability).join("\n\n")}`).join("\n\n"))
    } catch (e) { return text(error(e)) }
  })
  server.tool("get_vulnerability", "Retrieve one OSV vulnerability by ID, such as GHSA, CVE, or OSV identifier.", {
    id: z.string().min(1).describe("Vulnerability identifier, for example GHSA-... or CVE-..."),
  }, async ({ id }) => {
    try { return text(formatVulnerability(await getVulnerability(id))) } catch (e) { return text(error(e)) }
  })
  return server
}

export { OsvError }
