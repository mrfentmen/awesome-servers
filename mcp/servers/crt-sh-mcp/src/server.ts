import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchCertificates } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "crt-sh-mcp", version: "1.0.0" })

  server.tool(
    "search_certificates",
    "Certificates issued for a domain",
    { domain: z.string().min(3).describe("Domain, e.g. example.com"), limit: z.number().int().min(1).max(50).default(10).describe("How many certificates") },
    async ({ domain, limit }) => {
      try {
        return text(await searchCertificates(domain, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
