import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  createQuery,
  getQueryStatus,
  getQueryResults,
  cancelQuery,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "flipside-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "create_query",
    {
      title: "Run SQL query",
      description: "Submit a Flipside SQL query run against curated blockchain tables. Returns a token; poll status then fetch results.",
      inputSchema: z.object({
        sql: z.string().describe("SQL, e.g. 'SELECT * FROM ethereum.core.fact_transactions LIMIT 5'"),
        dataSource: z.string().default("snowflake").describe("Engine: snowflake or ..."),
        dataProvider: z.string().default("flipside").describe("Provider, usually flipside"),
      }),
      annotations: READ_ONLY,
    },
    async ({ sql, dataSource, dataProvider }) => {
      try {
        return text(await createQuery(sql, dataSource, dataProvider));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_query_status",
    {
      title: "Get query status",
      description: "Poll a Flipside query run: pending, running, finished or failed with row count.",
      inputSchema: z.object({
        token: z.string().describe("Query token from create_query"),
      }),
      annotations: READ_ONLY,
    },
    async ({ token }) => {
      try {
        return text(await getQueryStatus(token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_query_results",
    {
      title: "Get query results",
      description: "Fetch result rows for a finished Flipside query run, paged.",
      inputSchema: z.object({
        token: z.string().describe("Query token"),
        pageNumber: z.number().default(1).describe("Page number"),
        pageSize: z.number().default(100).describe("Rows per page, max 100000"),
      }),
      annotations: READ_ONLY,
    },
    async ({ token, pageNumber, pageSize }) => {
      try {
        return text(await getQueryResults(token, pageNumber, pageSize));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "cancel_query",
    {
      title: "Cancel query run",
      description: "Cancel a pending or running Flipside query.",
      inputSchema: z.object({
        token: z.string().describe("Query token"),
      }),
      annotations: NON_READ_ONLY,
    },
    async ({ token }) => {
      try {
        return text(await cancelQuery(token));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
