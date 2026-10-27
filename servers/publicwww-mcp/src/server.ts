import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchSnippets,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "publicwww-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_snippets",
    {
      title: "Snippet search",
      description: "URLs of sites containing a code snippet.",
      inputSchema: z.object({
        keywords: z.string().describe("Snippet text, e.g. jquery.")
      }),
      annotations: READ_ONLY,
    },
    async ({ keywords }) => {
      try {
        return text(await searchSnippets(keywords));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}