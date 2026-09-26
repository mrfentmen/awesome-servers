import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listAssistants,
  getAssistant,
  listCalls,
  getCall,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
export function createServer(): McpServer {
  const server = new McpServer({
    name: "vapi-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_assistants",
    {
      title: "List assistants",
      description: "Voice assistants.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listAssistants(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_assistant",
    {
      title: "Get assistant",
      description: "Assistant config by ID.",
      inputSchema: z.object({
        assistant_id: z.string().describe("Assistant UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ assistant_id }) => {
      try {
        return text(await getAssistant(assistant_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_calls",
    {
      title: "List calls",
      description: "Call history.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listCalls(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_call",
    {
      title: "Get call",
      description: "Call details and transcript.",
      inputSchema: z.object({
        call_id: z.string().describe("Call UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ call_id }) => {
      try {
        return text(await getCall(call_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}