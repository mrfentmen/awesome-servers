import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjects,
  getProject,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "swetrix-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "All Swetrix projects with ids and domains.",
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
      title: "Get project",
      description: "One Swetrix project with settings and stats summary.",
      inputSchema: z.object({
        projectId: z.string().describe("Project id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ projectId }) => {
      try {
        return text(await getProject(projectId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
