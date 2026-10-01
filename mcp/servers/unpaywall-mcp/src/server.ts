import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { oa } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "unpaywall-mcp", version: "1.0.0" })
  server.registerTool(
    "oa",
    {
      title: "Oa",
      description: "Find open access for a DOI.",
      inputSchema: z.object( { doi: z.string().describe("DOI."), email: z.string().describe("Email for the API.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await oa(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "oa_locations",
    {
      title: "OA locations",
      description: "Every open access copy Unpaywall knows for a paper with its host type, version and licence, not just the one it ranks best.",
      inputSchema: z.object( { doi: z.string().describe("doi, e.g. 10.1038/nature12373."), email: z.string().describe("Contact email Unpaywall asks for.").optional(), limit: z.number().describe("Max locations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: oa_locations ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_unpaywall_oa_locations", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "oa_status",
    {
      title: "OA status",
      description: "A paper's open access status, journal, DOAJ listing, publisher, date, authors and reference count, which the best-location view never shows.",
      inputSchema: z.object( { doi: z.string().describe("doi."), email: z.string().describe("Contact email.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: oa_status ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_unpaywall_oa_status", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
