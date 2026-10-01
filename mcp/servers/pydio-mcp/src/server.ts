import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listWorkspaces,
  getTreeStats,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pydio-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_workspaces",
    {
      title: "List workspaces",
      description: "Workspaces visible to the token user.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listWorkspaces());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_tree_stats",
    {
      title: "Tree stats",
      description: "Node statistics for workspace paths.",
      inputSchema: z.object({
        node_paths: z.string().describe("Comma-separated node paths, e.g. /common-files,/personal-files.")
      }),
      annotations: READ_ONLY,
    },
    async ({ node_paths }) => {
      try {
        return text(await getTreeStats(node_paths));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}