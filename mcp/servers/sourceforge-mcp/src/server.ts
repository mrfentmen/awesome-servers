import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatProject, getProject, SourceForgeError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "sourceforge-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_project",
    {
      title: "Get project",
      description: "A SourceForge project: name, description, link.",
      inputSchema: z.object({
        shortname: z.string().describe("Project shortname, e.g. 'filezilla'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ shortname }) => {
      try {
        return text(formatProject(await getProject(shortname)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_project_news",
    {
      title: "List project news",
      description: "Recent news and release announcement posts from a SourceForge project's Allura news feed.",
      inputSchema: z.object({
        shortname: z.string().describe("Project shortname, e.g. 'filezilla'"),
        limit: z.number().describe("Max posts, 1-50, default 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement news locally (paywall removed)
        try { return textError("Not yet implemented: news") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_project_activity",
    {
      title: "List project activity",
      description: "Recent activity feed for a SourceForge project: who did what, when, and a link to the item.",
      inputSchema: z.object({
        shortname: z.string().describe("Project shortname, e.g. 'filezilla'"),
        limit: z.number().describe("Max events, 1-50, default 12.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        // TODO: implement activity locally (paywall removed)
        try { return textError("Not yet implemented: activity") } catch (e) { return textError(String(e)) }
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SourceForgeError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
