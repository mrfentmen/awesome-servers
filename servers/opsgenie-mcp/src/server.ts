import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listAlerts,
  getAlert,
  listOnCalls,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opsgenie-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_alerts",
    {
      title: "List alerts",
      description: "Alerts.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listAlerts(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_alert",
    {
      title: "Get alert",
      description: "Alert details by ID.",
      inputSchema: z.object({
        alert_id: z.string().describe("Alert ID from the Opsgenie URL")
      }),
      annotations: READ_ONLY,
    },
    async ({ alert_id }) => {
      try {
        return text(await getAlert(alert_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_oncalls",
    {
      title: "List on-calls",
      description: "Current on-call rotations.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listOnCalls());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}