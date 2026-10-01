import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { format, inspectLicenseBoundary } from "./core.js"
import { errorMessage, searchSpdx, spdxLicense, spdxException } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)
export function createServer() {
  const server = new McpServer({ name: "license-boundary-mcp", version: "1.0.0" })
  server.registerTool(
    "inspect_license_boundary",
    {
      title: "Inspect license boundary",
      description: "Summarize local license evidence and uncertainty without returning package names, license text, paths, or source.",
      inputSchema: z.object( { project: z.string().min(1).max(1000).default(".") }),
      annotations: READ_ONLY,
    },
    async (input) => { try { return text(format(await inspectLicenseBoundary(input))) } catch (error) { return errorText(error) } }
  )
  server.registerTool(
    "search_spdx",
    {
      title: "Search spdx",
      description: "Search the live SPDX license catalog by name or identifier.",
      inputSchema: z.object({ query: z.string().max(200).optional(), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchSpdx(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "spdx_license",
    {
      title: "Spdx license",
      description: "Read public SPDX license text and approval flags.",
      inputSchema: z.object({ id: z.string().regex(/^[A-Za-z0-9.+-]+$/).default("MIT") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spdxLicense(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "spdx_exception",
    {
      title: "Spdx exception",
      description: "Read public SPDX linking-exception text and notes.",
      inputSchema: z.object({ id: z.string().regex(/^[A-Za-z0-9.+-]+$/).default("Classpath-exception-2.0") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await spdxException(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "npm_license_evidence",
    {
      title: "Npm license evidence",
      description: "Retrieve publisher-declared license evidence for a public npm package; sends only the provided public package identifier.",
      inputSchema: z.object({ package: z.string().min(1).max(214).default("express"), version: z.string().min(1).max(100).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: npm_license_evidence ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_license_boundary_npm_license_evidence", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "repo_license_evidence",
    {
      title: "Repo license evidence",
      description: "Retrieve GitHub license detection and evidence hash for a public repository; sends only the supplied owner and repository.",
      inputSchema: z.object({ owner: z.string().min(1).max(100).default("expressjs"), repo: z.string().min(1).max(100).default("express") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: repo_license_evidence ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_license_boundary_repo_license_evidence", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
