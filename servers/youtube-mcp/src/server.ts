import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  search,
  videoDetails,
  channelDetails,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "youtube-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search",
    {
      title: "Search videos",
      description: "Videos matching a query, with title, channel and views.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        max_results: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, max_results }) => {
      try {
        return text(await search(query, max_results));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "video_details",
    {
      title: "Video details",
      description: "Title, description, view and like counts for a video.",
      inputSchema: z.object({
        video_id: z.string().describe("Video ID, e.g. dQw4w9WgXcQ")
      }),
      annotations: READ_ONLY,
    },
    async ({ video_id }) => {
      try {
        return text(await videoDetails(video_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "channel_details",
    {
      title: "Channel details",
      description: "Subscriber and video counts for a channel.",
      inputSchema: z.object({
        channel_id: z.string().describe("Channel ID, e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw")
      }),
      annotations: READ_ONLY,
    },
    async ({ channel_id }) => {
      try {
        return text(await channelDetails(channel_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}