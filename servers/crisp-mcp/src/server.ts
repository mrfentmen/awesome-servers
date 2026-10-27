import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listVisitors,
  getProfile,
  getConversation,
  conversations,
  conversationMessages,
  conversationMeta,
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
      description: "Visitors on the site right now, with last page seen.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID, e.g. 8a1b2c3d-4e5f")
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
      description: "Crisp profile for one email, with custom fields.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID, e.g. 8a1b2c3d-4e5f"),
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
      description: "Messages in one conversation, by session id.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID, e.g. 8a1b2c3d-4e5f"),
        session_id: z.string().describe("Session ID, e.g. session_9f8c7b2a")
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

  server.registerTool(
    "conversations",
    {
      title: "Conversations",
      description: "Paged conversation list.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID."),
        page: z.string().describe("Page (default 1).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ website_id, page }) => {
      try {
        return text(await conversations(website_id, page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "conversation_messages",
    {
      title: "Messages",
      description: "Messages in a session.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID."),
        session_id: z.string().describe("Session ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ website_id, session_id }) => {
      try {
        return text(await conversationMessages(website_id, session_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "conversation_meta",
    {
      title: "Session meta",
      description: "Session metadata.",
      inputSchema: z.object({
        website_id: z.string().describe("Website ID."),
        session_id: z.string().describe("Session ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ website_id, session_id }) => {
      try {
        return text(await conversationMeta(website_id, session_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}