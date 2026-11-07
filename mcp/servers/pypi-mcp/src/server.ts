import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getPackage } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "pypi-mcp", version: "1.0.0" })

  server.tool(
    "get_package",
    "Metadata for a Python package",
    { name: z.string().min(1).describe("Package name, e.g. requests") },
    async ({ name }) => {
      try {
        return text(await getPackage(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
