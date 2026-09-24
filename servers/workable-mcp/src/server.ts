import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { boards } from "./api.js"
import { jobs } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "workable-mcp", version: "1.0.0" })
  server.registerTool(
    "boards",
    {
      title: "Boards",
      description: "List boards.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await boards(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description: "List jobs for a board.",
      inputSchema: z.object( { board: z.string().describe("Board account name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
