import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getMetrics,
  getLive,
  getPages,
  getReferrer,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "openpanel-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_metrics",
    {
      title: "Get metrics",
      description: "OpenPanel visitors, sessions, bounce rate and engagement for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
        startDate: z.string().optional().describe("Start YYYY-MM-DD"),
        endDate: z.string().optional().describe("End YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId, startDate, endDate }) => {
      try {
        return text(await getMetrics(projectId, startDate, endDate));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_live",
    {
      title: "Get live visitors",
      description: "Current active OpenPanel visitor count for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getLive(projectId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_pages",
    {
      title: "Get top pages",
      description: "Top OpenPanel pages by sessions for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getPages(projectId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_referrer",
    {
      title: "Get referrers",
      description: "OpenPanel traffic sources for a project.",
      inputSchema: z.object({
        projectId: z.string().describe("OpenPanel project ID, e.g. 12345"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getReferrer(projectId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
