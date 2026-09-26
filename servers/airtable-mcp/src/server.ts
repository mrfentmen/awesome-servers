import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listBases,
  listTables,
  listRecords,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "airtable-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_bases",
    {
      title: "List bases",
      description: "Airtable bases the token can access.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBases());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_tables",
    {
      title: "List tables",
      description: "Tables in one base, e.g. appXXXXXXXXXXXXXX.",
      inputSchema: z.object({
        base_id: z.string().describe("Base ID, e.g. appXXXXXXXXXXXXXX")
      }),
      annotations: READ_ONLY,
    },
    async ({ base_id }) => {
      try {
        return text(await listTables(base_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_records",
    {
      title: "List records",
      description: "Records in one table, with an optional max_records cap.",
      inputSchema: z.object({
        base_id: z.string().describe("Base ID, e.g. appXXXXXXXXXXXXXX"),
        table: z.string().describe("Table name or ID."),
        max_records: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ base_id, table, max_records }) => {
      try {
        return text(await listRecords(base_id, table, max_records));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}