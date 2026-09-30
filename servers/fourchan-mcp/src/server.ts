import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { ChanError, formatPost, formatThreadSummary, getCatalog, getThread, listBoards, boardConfig } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fourchan-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_boards",
    {
      title: "List boards",
      description: "List all 4chan boards with titles and SFW flags.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
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
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_catalog",
    {
      title: "Get catalog",
      description: "Get the catalog (all live threads) for a board.",
      inputSchema: z.object(
    { board: z.string().describe("Board, e.g. 'g', 'v', 'biz', 'pol'"), limit: z.number().int().min(1).max(50).default(20) }),
      annotations: READ_ONLY,
    },
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
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_thread",
    {
      title: "Get thread",
      description: "Read a thread's posts by thread number.",
      inputSchema: z.object(
    { board: z.string().describe("Board, e.g. 'g'"), threadNo: z.number().int().describe("Thread number from get_catalog") }),
      annotations: READ_ONLY,
    },
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
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "board_thread_index",
    {
      title: "Board thread index",
      description: "Compact live-thread index for a 4chan board: every thread's number, bump time and reply/image counts, newest first.",
      inputSchema: z.object({
    board: z.string().describe("Board, e.g. 'g', 'biz', 'pol'"),
    limit: z.number().int().min(1).max(200).default(20).describe("Max threads"),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: board_thread_index ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fourchan_board_thread_index", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "board_config",
    {
      title: "Board configuration",
      description: "The limits 4chan publishes for one board: pages, threads per page, bump and image caps, upload ceilings, cooldowns, archived state.",
      inputSchema: z.object({
    board: z.string().describe("Board, e.g. 'g'"),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await boardConfig(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "thread_media_gallery",
    {
      title: "Thread media gallery",
      description: "Every media attachment in a 4chan thread with dimensions, thumbnail size, md5 and a live check of whether the file is still on the CDN.",
      inputSchema: z.object({
    board: z.string().describe("Board, e.g. 'g'"),
    threadNo: z.number().int().describe("Thread number from board_thread_index"),
    limit: z.number().int().min(1).max(20).default(15).describe("Max files"),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: thread_media_gallery ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_fourchan_thread_media_gallery", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ChanError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
