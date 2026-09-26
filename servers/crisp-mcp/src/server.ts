import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listVisitors,
  getProfile,
  getConversation,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "crisp-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_visitors",
    {
      title: "Visitors",
      description: "Active visitors.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ website_id }) => {
      try {
        return text(await listVisitors(website_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_profile",
    {
      title: "People profile",
      description: "Profile by email.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID."),
        email: z.string().describe("Visitor email.")
      }),
      annotations: READ_ONLY,
    },
    async ({ website_id, email }) => {
      try {
        return text(await getProfile(website_id, email));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_conversation",
    {
      title: "Conversation",
      description: "Conversation details.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID."),
        session_id: z.string().describe("Session ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ website_id, session_id }) => {
      try {
        return text(await getConversation(website_id, session_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}