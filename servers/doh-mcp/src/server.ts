import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  resolve,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "doh-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "resolve",
    {
      title: "Resolve DNS",
      description: "DNS records over HTTPS.",
      inputSchema: z.object({
        name: z.string().describe("Hostname, e.g. example.com."),
        type: z.string().describe("Record type (default A).").optional(),
        provider: z.string().describe("cloudflare or google (default cloudflare).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ name, type, provider }) => {
      try {
        return text(await resolve(name, type, provider));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}