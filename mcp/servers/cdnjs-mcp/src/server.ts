import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { library, search, libraryVersions, libraryKeywords } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cdnjs-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search cdnjs libraries.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "library",
    {
      title: "Library",
      description: "Details for one library.",
      inputSchema: z.object( { name: z.string().describe("Library name like react.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await library(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "version_assets",
    {
      title: "Version assets",
      description: "Every file cdnjs hosts for one library version, with the full Cloudflare URL for each.",
      inputSchema: z.object( { name: z.string().describe("cdnjs library name, e.g. bootstrap."), version: z.string().describe("Version. Defaults to current.").optional(), limit: z.number().describe("Max files.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement assets locally (paywall removed)
    try { return textError("Not yet implemented: assets") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "library_integrity",
    {
      title: "Library integrity",
      description: "The Subresource Integrity hash and ready to paste script tag for a library's default file.",
      inputSchema: z.object( { name: z.string().describe("cdnjs library name, e.g. bootstrap.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement integrity locally (paywall removed)
    try { return textError("Not yet implemented: integrity") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "library_versions",
    {
      title: "Library versions",
      description: "Every version of a library that cdnjs hosts, newest first, with the current one marked.",
      inputSchema: z.object( { name: z.string().describe("cdnjs library name, e.g. bootstrap."), limit: z.number().describe("Max versions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await libraryVersions(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "library_keywords",
    {
      title: "Library keywords",
      description: "Keywords, author, homepage, licence and repository for a library, plus how cdnjs tracks its version.",
      inputSchema: z.object( { name: z.string().describe("cdnjs library name, e.g. bootstrap.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await libraryKeywords(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
