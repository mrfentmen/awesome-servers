import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { myip, myIpv6 } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ipify-mcp", version: "1.0.0" })
  server.registerTool(
    "myip",
    {
      title: "Myip",
      description: "Your public IP address.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await myip(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "my_ipv6",
    {
      title: "My IPv6",
      description: "Your public address as seen by the dual stack endpoint, which answers with an IPv6 address when the connection has one. The myip tool can only ever report IPv4.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await myIpv6(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "dual_stack",
    {
      title: "Dual stack",
      description: "Both public addresses side by side, the IPv4 one and the dual stack one, each labelled with the family it turned out to be, so an IPv4 only connection is stated rather than implied.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: dual_stack ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_ipify_dual_stack", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
