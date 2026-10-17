import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, listFileFormats, getProduct, listDrafts, getDraft, freeModelSearch } from "./api.js"
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
        return textError(String(e));
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
        return textError(String(e));
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
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_draft",
    {
      title: "Get draft",
      description: "Draft metadata by draft ID (requires TURBOSQUID_API_TOKEN).",
      inputSchema: z.object({
        draft_id: z.string().describe("Draft ID from the TurboSquid upload")
      }),
      annotations: READ_ONLY,
    },
    async ({ draft_id }) => {
      try {
        return text(await getDraft(draft_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "mesh_format_survey",
    {
      title: "Mesh format survey",
      description:
        "What a real freely published 3D model library is actually made of: mesh formats by file count and share, total and median size per format, models shipping more than one format, preview coverage, and the largest files. Reads a public repository, no TurboSquid token needed.",
      inputSchema: z.object({
        limit: z.number().describe("Max formats and files listed, 1-30. Defaults to 12.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement survey locally (paywall removed)
    try { return textError("Not yet implemented: survey") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "free_model_search",
    {
      title: "Free model search",
      description:
        "Freely reusable 3D models on a given subject, from a public keyless library, each with its real file inventory: which formats it ships in, how large they are, whether it is bundled as an archive and whether a preview exists. For when a marketplace search returns only paid assets.",
      inputSchema: z.object({
        query: z.string().describe("Subject to search for, e.g. rover, telescope, spacesuit."),
        limit: z.number().describe("Max matches listed, 1-30. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await freeModelSearch(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}