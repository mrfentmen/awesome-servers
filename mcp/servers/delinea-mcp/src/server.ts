import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchSecrets,
  getSecret,
  listFolders,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "delinea-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_secrets",
    {
      title: "Search secrets",
      description: "Search Delinea secrets by text across allowed vaults.",
      inputSchema: z.object({
        query: z.string().describe("Search text"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query }) => {
      try {
        return text(await searchSecrets(query));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_secret",
    {
      title: "Get secret",
      description: "Retrieve one Delinea secret with field values.",
      inputSchema: z.object({
        secretId: z.string().describe("Secret id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ secretId }) => {
      try {
        return text(await getSecret(secretId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_folders",
    {
      title: "List folders",
      description: "Top-level Delinea secret folders.",
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

  return server
}
