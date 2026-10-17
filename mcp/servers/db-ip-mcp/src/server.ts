import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { lookup, egressProfile } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "db-ip-mcp", version: "1.0.0" })
  server.registerTool(
    "lookup",
    {
      title: "Lookup",
      description: "Look up an IP address.",
      inputSchema: z.object( { ip: z.string().describe("IP address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await lookup(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "rdap_registration",
    {
      title: "RDAP registration",
      description: "The authoritative allocation record for an IP address from the regional internet registry that actually holds it, via RDAP: the network name and handle, the start and end of the allocation, the announced CIDRs, the status, the registrant entity with its contact details and the registry event dates. The lookup tool asks where an address geolocates to; this asks who is registered to hold it.",
      inputSchema: z.object( { ip: z.string().describe("IP address, for example 8.8.8.8. IPv4 and IPv6 both work.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement registration locally (paywall removed)
    try { return textError("Not yet implemented: registration") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "egress_profile",
    {
      title: "Egress profile",
      description: "Where this connection leaves from, without you having to know your own address: the public IP, what the DB-IP free tier says about it, what a second provider says including the coordinates, time zone and autonomous system, and a plain note where the two disagree. The lookup tool requires you to already know an IP and never returns coordinates or a time zone.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await egressProfile()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
