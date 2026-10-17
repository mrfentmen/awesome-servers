import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { vendorLookup } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "mac-lookup-mcp", version: "1.0.0" })
  server.registerTool(
    "vendor_lookup",
    {
      title: "Vendor lookup",
      description: "Get the vendor for a MAC address.",
      inputSchema: z.object( { mac: z.string().describe("MAC address like 3c:07:54:11:22:33.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await vendorLookup(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "oui_lookup",
    {
      title: "OUI lookup",
      description: "Look up the vendor behind a MAC address's first three octets, the block the IEEE actually assigned.",
      inputSchema: z.object( { oui: z.string().describe("OUI prefix like 3C:07:54, or a full MAC address.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
