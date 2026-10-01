import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { info } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "unpkg-mcp", version: "1.0.0" })
  server.registerTool(
    "info",
    {
      title: "Info",
      description: "Metadata for an npm package from unpkg.",
      inputSchema: z.object( { name: z.string().describe("Package name."), version: z.string().describe("Version.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await info(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "files",
    {
      title: "Files",
      description: "List the files unpkg serves for a package version, with size, MIME type and path, for a directory or the package root.",
      inputSchema: z.object( { name: z.string().describe("Package name, e.g. lodash."), version: z.string().describe("Exact version, e.g. 4.17.21.").optional(), path: z.string().describe("Directory inside the package, e.g. / or dist/.").optional(), limit: z.number().int().min(1).max(200).default(20).describe("Max files.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: files ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_unpkg_files", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "read_file",
    {
      title: "Read file",
      description: "Read the first part of a file as published on unpkg, for a package version.",
      inputSchema: z.object( { name: z.string().describe("Package name, e.g. lodash."), path: z.string().describe("File path inside the package, e.g. package.json."), version: z.string().describe("Exact version, e.g. 4.17.21.").optional(), max_bytes: z.number().int().min(200).max(20000).default(2000).describe("Characters to return.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: read_file ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_unpkg_read_file", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
