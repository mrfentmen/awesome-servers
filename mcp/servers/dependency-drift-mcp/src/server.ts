const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectDependencyDrift, inspectInstallScripts, inspectLockIntegrity } from "./drift.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "dependency-drift-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_dependency_drift",
    {
      title: "Inspect dependency drift",
      description: "Summarize local dependency manifest and lockfile drift without returning package names, versions, paths, or file contents.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await inspectDependencyDrift(project))) }
      catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "inspect_install_scripts",
    {
      title: "Inspect install scripts",
      description: "Count npm lifecycle hook scripts across local manifests without returning package names, script bodies, paths, or file contents.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await inspectInstallScripts(project))) }
      catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "inspect_lock_integrity",
    {
      title: "Inspect lock integrity",
      description: "Count npm lockfile entries that carry or lack integrity and resolved fields, without returning package names, hashes, URLs, or paths.",
      inputSchema: z.object(
    { project: z.string().min(1).max(1000).default(".").describe("Local project directory; no URLs or commands") }),
      annotations: READ_ONLY,
    },
    async ({ project }) => {
      try { return text(format(await inspectLockIntegrity(project))) }
      catch (error) { return errorText(error) }
    }
  )
  server.registerTool(
    "npm_release_metadata",
    {
      title: "Npm release metadata",
      description: "Fetch the current npm latest-tag release, engine constraints, dependencies and distribution integrity without reading a local manifest. Defaults to zod.",
      inputSchema: z.object({ package: z.string().max(214).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement metadata locally (paywall removed)
    try { return textError("Not yet implemented: metadata") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "npm_version_advisories",
    {
      title: "Npm version advisories",
      description: "Query OSV for vulnerabilities affecting an exact npm package version, including reported fixed versions. Defaults to lodash 4.17.20; reads no local files.",
      inputSchema: z.object({ package: z.string().max(214).optional(), version: z.string().max(100).optional(), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement advisories locally (paywall removed)
    try { return textError("Not yet implemented: advisories") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
