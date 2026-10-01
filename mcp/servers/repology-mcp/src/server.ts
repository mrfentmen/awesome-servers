import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { project } from "./api.js"
import { projects } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "repology-mcp", version: "1.0.0" })
  server.registerTool(
    "project",
    {
      title: "Project",
      description: "Get package versions across repos.",
      inputSchema: z.object( { name: z.string().describe("Package name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await project(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "projects",
    {
      title: "Projects",
      description: "List all projects matching a pattern.",
      inputSchema: z.object( { pattern: z.string().describe("Name pattern.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await projects(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
