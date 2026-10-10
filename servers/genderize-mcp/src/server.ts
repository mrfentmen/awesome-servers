import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { gender } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "genderize-mcp", version: "1.0.0" })
  server.registerTool(
    "gender",
    {
      title: "Gender",
      description: "Estimated gender for a name.",
      inputSchema: z.object( { name: z.string().describe("First name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gender(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gender_batch",
    {
      title: "Gender batch",
      description: "Look up up to 100 first names in one Genderize request, with confidence and the number of people recorded per name.",
      inputSchema: z.object( { names: z.string().describe("First names, comma separated, up to 100.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: gender_batch ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_genderize_gender_batch", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
