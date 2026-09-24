import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { findSubscriber, formatNamed, KitError, listBroadcasts, listForms } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "convertkit-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "find_subscriber",
    {
      title: "Find subscriber",
      description: "Find a Kit subscriber by email: name, state, join date.",
      inputSchema: z.object({
        email: z.string().describe("Email address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ email }) => {
      try {
        const s = await findSubscriber(email)
        if (!s) return text(`No Kit subscriber ${email}.`)
        return text(`${s.email ?? email}${s.firstName ? ` (${s.firstName})` : ""}${s.state ? ` [${s.state}]` : ""}${s.created ? ` — since ${s.created}` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_forms",
    {
      title: "List forms",
      description: "Kit signup forms.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(formatNamed(await listForms(limit), "forms"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_broadcasts",
    {
      title: "List broadcasts",
      description: "Kit email broadcasts (newsletters sent).",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(formatNamed(await listBroadcasts(limit), "broadcasts"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof KitError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
