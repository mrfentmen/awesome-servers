import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { CveError, lookup } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cveawg-mcp", version: "1.0.0" })

  server.tool(
    "cve",
    "One CVE record from MITRE's CVE Services: description, CVSS severity, affected products, weakness and references.",
    { id: z.string().min(10).describe('CVE id, e.g. "CVE-2024-3094"') },
    async ({ id }) => {
      try {
        return text(await lookup(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
