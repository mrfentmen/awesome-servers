import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listModels,
  keyInfo,
  credits,
  getModel,
  searchModels,
  freeModels,
  longestContext,
  modelEndpoints,
  generationStats,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openrouter-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_models",
    {
      title: "List models",
      description: "Models available on OpenRouter, with context size and price.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listModels());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "key_info",
    {
      title: "Key info",
      description: "What the current key can spend, and how much is left.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await keyInfo());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "credits",
    {
      title: "Credits",
      description: "Remaining credit balance for the account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await credits());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_model",
    {
      title: "Get model",
      description: "Model metadata by ID.",
      inputSchema: z.object({
        model_id: z.string().describe("e.g. openai/gpt-4o.")
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
    "search_models",
    {
      title: "Search models",
      description: "Models matching text.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchModels(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "free_models",
    {
      title: "Free models",
      description: ":free tier models.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await freeModels(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "longest_context",
    {
      title: "Biggest context",
      description: "Top context windows.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await longestContext(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "model_endpoints",
    {
      title: "Model endpoints",
      description: "Providers/pricing per model.",
      inputSchema: z.object({
        author: z.string().describe("e.g. openai."),
        slug: z.string().describe("e.g. gpt-4o.")
      }),
      annotations: READ_ONLY,
    },
    async ({ author, slug }) => {
      try {
        return text(await modelEndpoints(author, slug));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "generation_stats",
    {
      title: "Generation stats",
      description: "Cost/usage of a completion.",
      inputSchema: z.object({
        generation_id: z.string().describe("Generation ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ generation_id }) => {
      try {
        return text(await generationStats(generation_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}