import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listModels,
  getModel,
  listModelFiles,
  getMe,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cgtrader-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_models",
    {
      title: "List models",
      description: "Page through CGTrader 3D models.",
      inputSchema: z.object({
        page: z.string().describe("Page number.").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ page }) => {
      try {
        return text(await listModels(page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_model",
    {
      title: "Get model",
      description: "CGTrader model details by ID.",
      inputSchema: z.object({
        model_id: z.string().describe("Numeric model ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ model_id }) => {
      try {
        return text(await getModel(model_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_model_files",
    {
      title: "List model files",
      description: "Files attached to a CGTrader model.",
      inputSchema: z.object({
        model_id: z.string().describe("Numeric model ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ model_id }) => {
      try {
        return text(await listModelFiles(model_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_me",
    {
      title: "Get me",
      description: "User profile for the access token.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMe());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}