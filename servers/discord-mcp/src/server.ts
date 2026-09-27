import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { DiscordError, formatInvite, formatMembers, formatWidget, getWidget, lookupInvite, widgetMembers } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "discord-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "lookup_invite",
    {
      title: "Look up invite",
      description: "Look up a Discord invite code or URL: server name, description, member and online counts.",
      inputSchema: z.object({
        code: z.string().describe("Invite code or URL, e.g. 'python' or 'https://discord.gg/python'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ code }) => {
      try {
        return text(formatInvite(await lookupInvite(code)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_widget",
    {
      title: "Get server widget",
      description: "Live status of a Discord server: online count, top channels, instant invite. Needs the widget enabled.",
      inputSchema: z.object({
        guild_id: z.string().describe("Numeric guild id (shown by lookup_invite)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ guild_id }) => {
      try {
        return text(formatWidget(await getWidget(guild_id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "widget_members",
    {
      title: "Widget members",
      description: "Who is online now with status and game. Needs the widget enabled.",
      inputSchema: z.object({
        guild_id: z.string().describe("Numeric guild id (shown by lookup_invite)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ guild_id }) => {
      try {
        return text(formatMembers(await widgetMembers(guild_id), guild_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DiscordError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
