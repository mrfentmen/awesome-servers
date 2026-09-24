import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { boardPins, formatBoard, formatPin, getBoard, getPin, listBoards, myAccount, PinterestError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pinterest-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "my_account",
    {
      title: "My account",
      description: "Your Pinterest account: username, profile image, website.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const a = await myAccount()
        return text(`@${a.username ?? "?"}${a.websiteUrl ? `\n${a.websiteUrl}` : ""}${a.profileImage ? `\n${a.profileImage}` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_boards",
    {
      title: "List boards",
      description: "Your Pinterest boards: names, descriptions, pin counts.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(250).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const rows = await listBoards(limit)
        if (rows.length === 0) return text("No boards.")
        return text(rows.map((b, i) => formatBoard(b, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_board",
    {
      title: "Get board",
      description: "One Pinterest board with its pins.",
      inputSchema: z.object({
        id: z.string().describe("Board id"),
        limit: z.number().int().min(1).max(250).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ id, limit }) => {
      try {
        const b = await getBoard(id)
        const pins = await boardPins(id, limit)
        return text(`${formatBoard(b)}\n\nPins:\n\n${pins.map((p, i) => formatPin(p, i)).join("\n\n") || "(none)"}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_pin",
    {
      title: "Get pin",
      description: "One Pinterest pin: title, description, link, image.",
      inputSchema: z.object({
        id: z.string().describe("Pin id"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatPin(await getPin(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof PinterestError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
