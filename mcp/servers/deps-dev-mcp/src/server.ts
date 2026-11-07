import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getPackage } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "deps-dev-mcp", version: "1.0.0" })

  server.tool(
    "get_package",
    "Versions and metadata for a package",
    { system: z.enum(["npm", "pypi", "cargo", "go", "maven", "nuget"]).describe("Package ecosystem"), name: z.string().min(1).describe("Package name, e.g. react") },
    async ({ system, name }) => {
      try {
        return text(await getPackage(system, name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
