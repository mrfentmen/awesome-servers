import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { explainEvidence, format } from "./evidence.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "evidence-diff-mcp", version: "1.0.0" })
  server.tool(
    "explain_change_evidence",
    "Explain coarse changes in local Git and test-build evidence without returning source diffs, file contents, or secrets.",
    { project: z.string().min(1).max(1000).describe("Local Git project directory; no URLs") },
    async ({ project }) => {
      try { return text(format(await explainEvidence(project))) } catch (error) { return errorText(error) }
    },
  )
  return server
}
