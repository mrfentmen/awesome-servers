import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ipinfo-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up an IP address.",
      inputSchema: z.object( { ip: z.string().describe("IP address (defaults to caller IP).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "network_profile",
    {
      title: "Network profile",
      description: "The network side of an IP address from ipwho.is: continent, calling code, capital and land borders, plus the owning ASN, organisation, ISP and the local time zone with its UTC offset.",
      inputSchema: z.object( { ip: z.string().describe("IPv4 or IPv6 address, e.g. 8.8.8.8. Defaults to the caller's own address.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: network_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ipinfo_network_profile", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
