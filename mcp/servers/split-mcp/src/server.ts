import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listWorkspaces,
  listSplits,
  listSegments,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "split-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_workspaces",
    {
      title: "List workspaces",
      description: "Split workspaces with ids for scoped queries.",
      inputSchema: z.object({
      }),
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
    "list_splits",
    {
      title: "List splits",
      description: "Feature flags in a Split workspace with treatments and defaults.",
      inputSchema: z.object({
        workspaceId: z.string().describe("Workspace id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ workspaceId }) => {
      try {
        return text(await listSplits(workspaceId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_segments",
    {
      title: "List segments",
      description: "Targeting segments in a Split workspace.",
      inputSchema: z.object({
        workspaceId: z.string().describe("Workspace id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ workspaceId }) => {
      try {
        return text(await listSegments(workspaceId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
