import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectDependencyDrift, inspectInstallScripts, inspectLockIntegrity } from "./drift.js"
import { premiumRequired } from "./license.js"

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
      // ---- paywall: inspect_install_scripts ----
      const paywallMessage = await premiumRequired("inspect_install_scripts")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
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
      // ---- paywall: inspect_lock_integrity ----
      const paywallMessage = await premiumRequired("inspect_lock_integrity")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try { return text(format(await inspectLockIntegrity(project))) }
      catch (error) { return errorText(error) }
    }
  )
  return server
}
