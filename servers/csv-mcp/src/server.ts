import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { csvInfo, parseCsv } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "csv-mcp", version: "1.0.0" })
  server.registerTool(
    "parse_csv",
    {
      title: "Parse csv",
      description: "Parse CSV text into a table view.",
      inputSchema: z.object( { csv: z.string().describe("CSV text."), max_rows: z.number().describe("Max rows.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await parseCsv(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "csv_info",
    {
      title: "Csv info",
      description: "Return columns and row count for CSV text.",
      inputSchema: z.object( { csv: z.string().describe("CSV text.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await csvInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "csv_to_json",
    {
      title: "CSV to JSON",
      description: "Turn CSV text into JSON records, using the first row as the object keys.",
      inputSchema: z.object( { csv: z.string().describe("CSV text."), max_rows: z.number().describe("Max records to emit.").optional(), pretty: z.boolean().describe("Indent the JSON.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: csv_to_json ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_csv_csv_to_json", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "csv_validate",
    {
      title: "CSV validate",
      description: "Check CSV text for ragged rows, duplicate or blank headers, empty cells and a wrong delimiter.",
      inputSchema: z.object( { csv: z.string().describe("CSV text."), delimiter: z.string().describe("Expected delimiter, default comma.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: csv_validate ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_csv_csv_validate", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
