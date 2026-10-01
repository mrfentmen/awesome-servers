import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ipwhois-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Details for one IP address.",
      inputSchema: z.object( { ip: z.string().describe("IP address.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "rdap_lookup",
    {
      title: "RDAP lookup",
      description: "The authoritative registration record for an IP network straight from the regional registry, over RDAP: network name, handle, address range, registry whois server, events and registered entities.",
      inputSchema: z.object( { ip: z.string().describe("IPv4 or IPv6 address, e.g. 8.8.8.8.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: rdap_lookup ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ipwhois_rdap_lookup", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
