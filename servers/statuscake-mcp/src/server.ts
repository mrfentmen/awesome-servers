import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listChecks,
  getCheck,
  getHistory,
  listLocations,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "statuscake-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_checks",
    {
      title: "List uptime checks",
      description: "All StatusCake uptime checks with status, URL and check rate.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listChecks());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_check",
    {
      title: "Get check detail",
      description: "One StatusCake uptime check with full settings.",
      inputSchema: z.object({
        checkId: z.string().describe("Check id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ checkId }) => {
      try {
        return text(await getCheck(checkId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_history",
    {
      title: "Get check history",
      description: "Uptime history for a check over a period.",
      inputSchema: z.object({
        checkId: z.string().describe("Check id"),
        from: z.string().optional().describe("Start ISO date"),
        to: z.string().optional().describe("End ISO date"),
      }),
      annotations: READ_ONLY,
    },
    async ({ checkId, from, to }) => {
      try {
        return text(await getHistory(checkId, from, to));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_locations",
    {
      title: "List monitoring locations",
      description: "StatusCake monitoring locations for firewall allowlisting.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listLocations());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
