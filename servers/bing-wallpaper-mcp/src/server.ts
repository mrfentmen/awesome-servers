import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { recent, today, markets } from "./api.js"
import { premiumTool } from "./gateway.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "bing-wallpaper-mcp", version: "1.0.0" })
  server.registerTool(
    "today",
    {
      title: "Today",
      description: "Today Bing wallpaper.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await today(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "recent",
    {
      title: "Recent",
      description: "Recent Bing wallpapers.",
      inputSchema: z.object( { count: z.number().describe("How many days back.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recent(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "archive",
    {
      title: "Archive",
      description: "Walk back through Bing's wallpaper archive by day offset, in any market, which the recent tool's few days cannot do. Reports the feed's real per-request cap.",
      inputSchema: z.object( { idx: z.number().describe("How many days back to start, 0 is today. Defaults to 0.").optional(), count: z.number().describe("How many days from there, 1-16. Defaults to 4.").optional(), market: z.string().describe("Market code like en-US, en-GB or de-DE. Defaults to en-US.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: archive ----
    // The body runs on the gateway, behind the licence gate.
    try { return text(await premiumTool("mcp_bing_wallpaper_archive", args)) } catch (e) { return textError(error(e)) }
    // ---- paywall: end ----
  }
  )

  server.registerTool(
    "markets",
    {
      title: "Markets",
      description: "The same day's wallpaper side by side across several markets, which shows that the market parameter really changes the picture rather than being ignored.",
      inputSchema: z.object( { markets: z.string().describe("Comma separated market codes, 2 to 6, like en-US,en-GB,de-DE. Defaults to en-US,en-GB,de-DE,ja-JP.").optional(), idx: z.number().describe("How many days back, 0 is today. Defaults to 0.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await markets(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
