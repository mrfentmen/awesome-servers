import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjects,
  getProject,
  getHistory,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "appveyor-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "All AppVeyor projects with last build status.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listProjects());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_project",
    {
      title: "Get project build",
      description: "Latest AppVeyor build for a project with jobs and status.",
      inputSchema: z.object({
        account: z.string().describe("Account name"),
        slug: z.string().describe("Project slug"),
      }),
      annotations: READ_ONLY,
    },
    async ({ account, slug }) => {
      try {
        return text(await getProject(account, slug));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_history",
    {
      title: "Get build history",
      description: "Recent AppVeyor builds for a project branch.",
      inputSchema: z.object({
        account: z.string().describe("Account"),
        slug: z.string().describe("Slug"),
        records: z.number().default(10).describe("How many builds"),
      }),
      annotations: READ_ONLY,
    },
    async ({ account, slug, records }) => {
      try {
        return text(await getHistory(account, slug, records));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
