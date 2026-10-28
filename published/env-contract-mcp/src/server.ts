import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { analyze, format } from "./contract.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "env-contract-mcp", version: "1.0.0" })
  server.tool("inspect_contract", "Inspect a local project for declared and referenced environment variable names without reading values.", { project: z.string().min(1).max(1000).describe("Local project directory; no network URLs") }, async ({ project }) => { try { return text(format(await analyze(project))) } catch (error) { return errorText(error) } })
  return server
}
