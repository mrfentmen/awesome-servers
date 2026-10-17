import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listProjects, getBalance, listKeys, requestLog, usageBreakdown, projectMembers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "deepgram-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Deepgram projects with IDs and names.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProjects());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_balance",
    {
      title: "Project balance",
      description: "Credit balance for one Deepgram project.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await getBalance(project_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_keys",
    {
      title: "List API keys",
      description: "API keys on the project, with scopes and created date.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await listKeys(project_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "request_log",
    {
      title: "Request log with cost",
      description: "Every request a Deepgram project has made, with the recorded cost, audio handled and models used, rolled up by endpoint and by model, plus any request that returned an error status. Failed requests are still billed as audio handled, so the failures are called out alongside what they cost. Can be filtered by endpoint, method, status or deployment and paged.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID."),
        start: z.string().optional().describe("Start of the window, 2026-09-01 or 2026-09-01T09:00:00."),
        end: z.string().optional().describe("End of the window."),
        limit: z.number().int().min(1).max(1000).default(10).describe("Requests per page, 1-1000, default 10"),
        page: z.number().int().min(0).default(0).describe("Page index, 0-based"),
        endpoint: z.string().optional().describe("Filter: listen, read, speak or agent"),
        method: z.string().optional().describe("Filter: sync, async or streaming"),
        status: z.string().optional().describe("Filter: succeeded (code under 300) or failed (400 and up)"),
        deployment: z.string().optional().describe("Filter: hosted, beta or self-hosted"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await requestLog(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "usage_breakdown",
    {
      title: "Usage breakdown by group",
      description: "Deepgram usage grouped by accessor, endpoint, feature set, models, method, tags or deployment, with requests, hours and token counts per group plus each group's share of total hours. This is how you find which model or feature is actually consuming the budget.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID."),
        grouping: z.string().default("endpoint").describe("accessor, endpoint, feature_set, models, method, tags or deployment, default endpoint"),
        start: z.string().optional().describe("Start of the window, 2026-09-01 or 2026-09-01T09:00:00."),
        end: z.string().optional().describe("End of the window."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await usageBreakdown(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "project_members",
    {
      title: "Project members and scopes",
      description: "Everyone with access to a Deepgram project, their email and the scopes they hold. Anyone listed can spend the project's balance, so this is the access-control check, and it distinguishes a listed member from a key that merely has project-scoped access.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await projectMembers(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}