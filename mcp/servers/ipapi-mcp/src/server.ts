import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ipapi-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up an IP address.",
      inputSchema: z.object( { ip: z.string().describe("IP address, defaults to caller.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "network_profile",
    {
      title: "Network profile",
      description: "Network intelligence for an IP: ISP, organisation, autonomous system, reverse DNS, timezone, currency and the mobile, proxy and hosting flags.",
      inputSchema: z.object({ ip: z.string().describe("IP address. Defaults to the caller's."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement profile locally (paywall removed)
    try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "ip_registration",
    {
      title: "Ip registration",
      description: "Authoritative RDAP registration record for an IP, CIDR or AS number: range, country, status, whois server and the registrant and abuse contacts.",
      inputSchema: z.object({ ip: z.string().describe("IP address, CIDR or AS number, e.g. 1.1.1.1 or AS15169."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement registration locally (paywall removed)
    try { return textError("Not yet implemented: registration") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
