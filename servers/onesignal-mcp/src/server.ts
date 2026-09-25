import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listApps,
  getApp,
  listNotifications,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "onesignal-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_apps",
    {
      title: "List apps",
      description: "OneSignal apps.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listApps());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_app",
    {
      title: "Get app",
      description: "App details by ID.",
      inputSchema: z.object({
        app_id: z.string().describe("OneSignal app ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ app_id }) => {
      try {
        return text(await getApp(app_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_notifications",
    {
      title: "List notifications",
      description: "Recent notifications for an app.",
      inputSchema: z.object({
        app_id: z.string().describe("OneSignal app ID."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ app_id, limit }) => {
      try {
        return text(await listNotifications(app_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}