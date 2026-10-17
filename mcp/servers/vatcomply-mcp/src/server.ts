import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { country, rates } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vatcomply-mcp", version: "1.0.0" })
  server.registerTool(
    "rates",
    {
      title: "Rates",
      description: "Current VAT rates.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rates(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "country",
    {
      title: "Country",
      description: "VAT details for a country.",
      inputSchema: z.object( { code: z.string().describe("ISO country code like DE.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await country(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "validate_vat_number",
    {
      title: "Validate VAT number",
      description: "Check an EU VAT number against the European Commission VIES service and report validity plus the registered name and address VIES returns.",
      inputSchema: z.object( { country: z.string().describe("Two-letter EU country code like DE."), number: z.string().describe("VAT number digits, e.g. 129274202.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement number locally (paywall removed)
    try { return textError("Not yet implemented: number") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
