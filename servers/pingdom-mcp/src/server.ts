import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listChecks,
  getCheck,
  getResults,
  getCredits,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pingdom-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_checks",
    {
      title: "List checks",
      description: "All Pingdom uptime checks with current status and response time.",
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
      description: "One Pingdom check with full configuration.",
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
    "get_results",
    {
      title: "Get check results",
      description: "Historical results for a check in a time window.",
      inputSchema: z.object({
        checkId: z.string().describe("Check id"),
        from: z.string().optional().describe("Start unix timestamp"),
        to: z.string().optional().describe("End unix timestamp"),
      }),
      annotations: READ_ONLY,
    },
    async ({ checkId, from, to }) => {
      try {
        return text(await getResults(checkId, from, to));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_credits",
    {
      title: "Get credits",
      description: "Remaining Pingdom API credits and rate-limit status.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getCredits());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
