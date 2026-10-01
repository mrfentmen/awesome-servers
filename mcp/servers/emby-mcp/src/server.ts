import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { EmbyError, formatLibrary, formatUser, listLibraries, listUsers, serverInfo } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "emby-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "server_info",
    {
      title: "Server info",
      description: "Public Emby server info: name, version. No key needed. Set EMBY_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const info = await serverInfo()
        return text(`${info.name ?? "Emby"}${info.version ? ` ${info.version}` : ""}${info.id ? `\nId: ${info.id}` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Users on the server with admin flags and activity. Needs EMBY_API_KEY.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listUsers()
        if (rows.length === 0) return text("No users.")
        return text(rows.map((u, i) => formatUser(u, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_libraries",
    {
      title: "List libraries",
      description: "Media libraries with collection types. Needs EMBY_API_KEY.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listLibraries()
        if (rows.length === 0) return text("No libraries.")
        return text(rows.map((l, i) => formatLibrary(l, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof EmbyError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
