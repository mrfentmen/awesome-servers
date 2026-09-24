import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchThreads,
  getThread,
  listFolders,
  getUser,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "quip-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_threads",
    {
      title: "Search threads",
      description: "Search Quip docs, spreadsheets and chats by text.",
      inputSchema: z.object({
        query: z.string().describe("Search text"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await searchThreads(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_thread",
    {
      title: "Get thread",
      description: "Quip thread with document HTML content.",
      inputSchema: z.object({
        threadId: z.string().describe("Thread id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ threadId }) => {
      try {
        return text(await getThread(threadId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_folders",
    {
      title: "List folders",
      description: "Quip folders including shared folders.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listFolders());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_user",
    {
      title: "Get current user",
      description: "Authenticated Quip user profile.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getUser());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
