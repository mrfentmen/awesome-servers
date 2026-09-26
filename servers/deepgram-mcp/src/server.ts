import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjects,
  getBalance,
  listKeys,
} from "./api.js"

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
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_balance",
    {
      title: "Project balance",
      description: "Credit balances of a project.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await getBalance(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_keys",
    {
      title: "List API keys",
      description: "API keys of a project.",
      inputSchema: z.object({
        project_id: z.string().describe("Project UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id }) => {
      try {
        return text(await listKeys(project_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}