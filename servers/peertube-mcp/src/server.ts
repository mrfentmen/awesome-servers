import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { searchVideos, instance } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'peertube-mcp', version: '1.0.0' })
  server.registerTool(
    'searchVideos',
    {
      title: "Search Videos",
      description: 'Search PeerTube.tv videos.',
      inputSchema: z.object( { query: z.string().describe('Search terms.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchVideos(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'instance',
    {
      title: "Instance",
      description: 'PeerTube.tv instance info.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instance(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_videos",
    {
      title: "Top videos",
      description: "Browse videos across the whole PeerTube federation on peertube.tv, sorted by trending, views, likes, recency or duration.",
      inputSchema: z.object( { sort: z.string().describe("trending, views, likes, published or duration.").optional(), limit: z.number().int().min(1).max(25).default(8).describe("Max videos.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: top_videos ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_peertube_top_videos", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "video_detail",
    {
      title: "Video detail",
      description: "Full detail for one PeerTube video by UUID: channel, views, likes, tags, licence, language and available qualities.",
      inputSchema: z.object( { uuid: z.string().describe("Video UUID from searchVideos or topVideos.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: video_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_peertube_video_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
