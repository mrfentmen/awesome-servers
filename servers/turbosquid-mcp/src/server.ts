import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listFileFormats,
  getProduct,
  listDrafts,
  getDraft,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "turbosquid-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_file_formats",
    {
      title: "List file formats",
      description: "3D file formats with extensions and renderers (requires TURBOSQUID_API_TOKEN).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listFileFormats());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "3D model product metadata by numeric product ID.",
      inputSchema: z.object({
        product_id: z.string().describe("Numeric TurboSquid product ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ product_id }) => {
      try {
        return text(await getProduct(product_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_drafts",
    {
      title: "List drafts",
      description: "New product drafts of the authenticated member (requires TURBOSQUID_API_TOKEN).",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDrafts());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_draft",
    {
      title: "Get draft",
      description: "Draft metadata by draft ID (requires TURBOSQUID_API_TOKEN).",
      inputSchema: z.object({
        draft_id: z.string().describe("Draft ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ draft_id }) => {
      try {
        return text(await getDraft(draft_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}