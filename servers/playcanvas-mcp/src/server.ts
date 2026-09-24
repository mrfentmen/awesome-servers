import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listProjectAssets,
  getAsset,
  getRateLimits,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "playcanvas-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_project_assets",
    {
      title: "List project assets",
      description: "Assets in a PlayCanvas project branch.",
      inputSchema: z.object({
        project_id: z.string().describe("Numeric project ID."),
        branch_id: z.string().describe("Branch ID from version control panel."),
        limit: z.string().describe("Max items (default 16).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ project_id, branch_id, limit }) => {
      try {
        return text(await listProjectAssets(project_id, branch_id, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_asset",
    {
      title: "Get asset",
      description: "Single PlayCanvas asset metadata.",
      inputSchema: z.object({
        asset_id: z.string().describe("Numeric asset ID."),
        branch_id: z.string().describe("Branch ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ asset_id, branch_id }) => {
      try {
        return text(await getAsset(asset_id, branch_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_rate_limits",
    {
      title: "Rate limits",
      description: "Current PlayCanvas REST API rate limits.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getRateLimits());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}