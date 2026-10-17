import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { searchVideos, instance } from "./api.js"
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
    try { return text(await searchVideos(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await instance(args)) } catch (e) { return textError(String(e)) }
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
    // TODO: implement videos locally (paywall removed)
    try { return textError("Not yet implemented: videos") } catch (e) { return textError(String(e)) }
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
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
