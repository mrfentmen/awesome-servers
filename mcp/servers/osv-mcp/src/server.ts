import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatVulnerability, getVulnerability, OsvError, queryBatch, queryPackage } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "osv-mcp", version: "1.0.0" })
  server.registerTool(
    "check_package",
    {
      title: "Check package",
      description: "Check a package and optional version for known open source vulnerabilities.",
      inputSchema: z.object( {
    ecosystem: z.string().min(1).describe("OSV ecosystem, for example npm, PyPI, Go, crates.io, Maven, or NuGet"),
    name: z.string().min(1).describe("Package name"),
    version: z.string().optional().describe("Exact installed version, if known"),
  }),
      annotations: READ_ONLY,
    },
    async ({ ecosystem, name, version }) => {
    try {
      const result = await queryPackage({ ecosystem, name, version })
      if (!result.vulns.length) return text(`No known OSV vulnerabilities found for ${ecosystem}/${name}${version ? `@${version}` : ""}.`)
      return text(`${ecosystem}/${name}${version ? `@${version}` : ""} has ${result.vulns.length} known vulnerability record(s):\n\n${result.vulns.map(formatVulnerability).join("\n\n")}`)
    } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "scan_packages",
    {
      title: "Scan packages",
      description: "Scan several package references in one OSV request. Pass a JSON array of ecosystem, name, and optional version.",
      inputSchema: z.object( {
    packages: z.array(z.object({ ecosystem: z.string().min(1), name: z.string().min(1), version: z.string().optional() })).min(1).max(100),
  }),
      annotations: READ_ONLY,
    },
    async ({ packages }) => {
    try {
      const results = await queryBatch(packages)
      const vulnerable = results.filter((r) => r.vulns.length)
      if (!vulnerable.length) return text(`No known vulnerabilities found across ${packages.length} package(s).`)
      return text(vulnerable.map((r) => `${r.ref.ecosystem}/${r.ref.name}${r.ref.version ? `@${r.ref.version}` : ""}: ${r.vulns.length} record(s)\n${r.vulns.map(formatVulnerability).join("\n\n")}`).join("\n\n"))
    } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "get_vulnerability",
    {
      title: "Get vulnerability",
      description: "Retrieve one OSV vulnerability by ID, such as GHSA, CVE, or OSV identifier.",
      inputSchema: z.object( {
    id: z.string().min(1).describe("Vulnerability identifier, for example GHSA-... or CVE-..."),
  }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
    try { return text(formatVulnerability(await getVulnerability(id))) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "advisory_database",
    {
      title: "Advisory database",
      description: "Search the GitHub Advisory Database: advisories affecting one package version, or the latest advisories for an ecosystem, with severity, CVSS, CWE and patch status.",
      inputSchema: z.object({
    ecosystem: z.string().min(1).optional().describe("GitHub ecosystem name: npm, pip, go, maven, nuget, rubygems, rust, packagist, actions. Defaults to npm."),
    package_name: z.string().min(1).optional().describe("Package name to look up advisories for. Takes priority over ecosystem."),
    version: z.string().min(1).optional().describe("Exact version of that package."),
    severity: z.string().min(1).optional().describe("Severity filter: low, moderate, high or critical. Only used when no package name is given."),
    limit: z.number().int().min(1).max(20).optional().describe("Max advisories, default 5."),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: advisory_database ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_osv_advisory_database", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "package_releases",
    {
      title: "Package releases",
      description: "Release history for a package from deps.dev: how many versions exist, when each was published, and the licenses and advisory links for a specific version.",
      inputSchema: z.object({
    system: z.string().min(1).describe("deps.dev system name, for example npm, PyPI, Go, crates.io, NuGet or Maven."),
    name: z.string().min(1).describe("Package name."),
    version: z.string().min(1).optional().describe("Exact version to report licenses and advisories for."),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: package_releases ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_osv_package_releases", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}

export { OsvError }
