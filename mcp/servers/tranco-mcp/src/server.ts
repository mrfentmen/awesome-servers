import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { domainRank } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "tranco-mcp", version: "1.0.0" })

  server.tool(
    "domain_rank",
    "Popularity rank history for a domain",
    { domain: z.string().min(3).describe("Domain, e.g. google.com") },
    async ({ domain }) => {
      try {
        return text(await domainRank(domain))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
