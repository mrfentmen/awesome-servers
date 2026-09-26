import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  listProjects,
  listInsights,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "posthog-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "PostHog user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await me());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_projects",
    {
      title: "List projects",
      description: "Analytics projects.",
      inputSchema: z.object({}),
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
    "list_insights",
    {
      title: "List insights",
      description: "Saved insights.",
      inputSchema: z.object({
        project_id: z.string().describe("Project ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await listInsights(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}