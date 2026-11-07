import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { lookupDomain } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rdap-mcp", version: "1.0.0" })

  server.tool(
    "lookup_domain",
    "Registration data for a domain",
    { domain: z.string().min(3).describe("Domain, e.g. example.com") },
    async ({ domain }) => {
      try {
        return text(await lookupDomain(domain))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
