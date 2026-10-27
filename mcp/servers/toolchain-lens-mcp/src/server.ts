import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { explain, format } from "./lens.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "toolchain-lens-mcp", version: "1.0.0" })
  server.tool(
    "explain_toolchain",
    "Explain local reproducibility signals and contradictions without returning exact versions, dependency names, or secret values.",
    { project: z.string().min(1).max(1000).describe("Local project directory; no URLs") },
    async ({ project }) => {
      try { return text(format(await explain(project))) } catch (error) { return errorText(error) }
    },
  )
  return server
}
