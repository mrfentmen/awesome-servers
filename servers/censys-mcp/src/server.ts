import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getHost,
  searchHosts,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "censys-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_host",
    {
      title: "Host lookup",
      description: "Censys record for an IP: services, ports and certificates.",
      inputSchema: z.object({
        ip: z.string().describe("IPv4/IPv6 address.")
      }),
      annotations: READ_ONLY,
    },
    async ({ ip }) => {
      try {
        return text(await getHost(ip));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_hosts",
    {
      title: "Search hosts",
      description: "Search hosts with Censys query syntax, e.g. services.http.",
      inputSchema: z.object({
        query: z.string().describe("e.g. services.service_name: HTTP."),
        per_page: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, per_page }) => {
      try {
        return text(await searchHosts(query, per_page));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}