import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { chat, GroqError, listModels } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "groq-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "chat",
    {
      title: "Chat completion",
      description: "Ask a Groq-hosted LLM. Fast inference, OpenAI-compatible.",
      inputSchema: z.object({
        message: z.string().describe("User message"),
        model: z.string().default("llama-3.3-70b-versatile").describe("Model id (use list_models)"),
        system: z.string().default("").describe("Optional system prompt"),
      }),
      annotations: READ_ONLY,
    },
    async ({ message, model, system }) => {
      try {
        return text(await chat(model, message, system))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_models",
    {
      title: "List models",
      description: "Available Groq model ids.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listModels()
        if (rows.length === 0) return text("No models.")
        return text(rows.map((m, i) => `${i + 1}. ${m}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof GroqError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
