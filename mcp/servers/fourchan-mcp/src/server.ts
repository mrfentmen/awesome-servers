import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ChanError,
  formatPost,
  formatThreadSummary,
  getCatalog,
  getThread,
  listBoards,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fourchan-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_boards",
    "List all 4chan boards with titles and SFW flags.",
    {},
    async () => {
      try {
        const boards = await listBoards()
        const sfw = boards.filter((b) => b.sfw)
        const nsfw = boards.filter((b) => !b.sfw)
        return text(
          `SFW boards:\n${sfw.map((b) => `  /${b.board}/ — ${b.title}`).join("\n")}\n\n` +
            `NSFW boards:\n${nsfw.map((b) => `  /${b.board}/ — ${b.title}`).join("\n")}`
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_catalog",
    "Get the catalog (all live threads) for a board.",
    { board: z.string().describe("Board, e.g. 'g', 'v', 'biz', 'pol'"), limit: z.number().int().min(1).max(50).default(20) },
    async ({ board, limit }) => {
      try {
        const threads = await getCatalog(board)
        if (threads.length === 0) return text(`No threads on /${board}/.`)
        const sorted = [...threads].sort((a, b) => b.replies - a.replies).slice(0, limit)
        return text(
          `/${board}/ catalog — top ${sorted.length} by replies:\n\n` +
            sorted.map((t, i) => formatThreadSummary(t, i)).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_thread",
    "Read a thread's posts by thread number.",
    { board: z.string().describe("Board, e.g. 'g'"), threadNo: z.number().int().describe("Thread number from get_catalog") },
    async ({ board, threadNo }) => {
      try {
        const posts = await getThread(board, threadNo)
        if (posts.length === 0) return text(`Thread ${threadNo} on /${board}/ has no posts.`)
        const max = Math.min(posts.length, 25)
        return text(
          `/${board}/ thread ${threadNo} — ${posts.length} posts (showing ${max}):\n\n` +
            posts.slice(0, max).map(formatPost).join("\n\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ChanError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
