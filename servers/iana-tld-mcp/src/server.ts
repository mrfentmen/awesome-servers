import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { list } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "iana-tld-mcp", version: "1.0.0" })
  server.registerTool(
    "list",
    {
      title: "List",
      description: "All top level domains.",
      inputSchema: z.object( { search: z.string().describe("Optional search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await list(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "rdap_servers",
    {
      title: "RDAP servers",
      description: "The RDAP servers IANA publishes for a TLD, the authoritative map from a domain suffix to the server that answers registration queries for it.",
      inputSchema: z.object( { tld: z.string().describe("TLD without the dot, e.g. com or uk.").optional(), search: z.string().describe("Scan every published zone for this term instead.").optional(), limit: z.number().describe("Max services to show.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: rdap_servers ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_iana_tld_rdap_servers", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
