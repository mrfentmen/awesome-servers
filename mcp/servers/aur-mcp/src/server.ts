import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { info, search, suggestNames } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "aur-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search AUR packages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "info",
    {
      title: "Info",
      description: "Details for one AUR package.",
      inputSchema: z.object( { name: z.string().describe("Package name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await info(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "suggest_names",
    {
      title: "Suggest names",
      description: "Package names the AUR suggests when a name is not found, e.g. what to type for yay.",
      inputSchema: z.object( { name: z.string().describe("Package name to get suggestions for.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await suggestNames(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "search_by_field",
    {
      title: "Search by field",
      description: "Search AUR packages on a chosen field such as maintainer, keywords, depends or groups.",
      inputSchema: z.object( { query: z.string().describe("Value to match in the field."), by: z.string().describe("Field, e.g. maintainer, keywords, depends.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement field locally (paywall removed)
    try { return textError("Not yet implemented: field") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "maintainer_packages",
    {
      title: "Maintainer packages",
      description: "Every AUR package a maintainer looks after, with vote totals, out of date and orphaned counts.",
      inputSchema: z.object( { maintainer: z.string().describe("Maintainer name, e.g. orhun."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement packages locally (paywall removed)
    try { return textError("Not yet implemented: packages") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
