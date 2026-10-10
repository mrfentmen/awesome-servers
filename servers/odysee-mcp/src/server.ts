import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, searchClaims, searchChannel, videoDetails, channelProfile } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "odysee-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_claims",
    {
      title: "Search videos",
      description: "Search Odysee videos by keyword: claim ids, titles, channels, durations.",
      inputSchema: z.object({
        query: z.string().describe("Search text"),
        size: z.number().default(10).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, size }) => {
      try {
        return text(await searchClaims(query, size));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_channel",
    {
      title: "Search channel videos",
      description: "Recent Odysee uploads from one channel handle, e.g. '@NASA'.",
      inputSchema: z.object({
        channel: z.string().describe("Channel handle like '@NASA'"),
        size: z.number().default(10).describe("How many results"),
      }),
      annotations: READ_ONLY,
    },
    async ({ channel, size }) => {
      try {
        return text(await searchChannel(channel, size));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "video_details",
    {
      title: "Video details",
      description: "Resolve one Odysee video URL into its full claim: title, duration, views, publish date, license, tags and description.",
      inputSchema: z.object( { url: z.string().describe("lbry:// or https://odysee.com URL.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: video_details ----
    const paywallMessage = await premiumRequired("video_details")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await videoDetails(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "channel_profile",
    {
      title: "Channel profile",
      description: "Resolve an Odysee channel handle into its public record: upload count, creation date, activation height and support amount.",
      inputSchema: z.object( { channel: z.string().describe("Channel handle like @veritasium.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: channel_profile ----
    const paywallMessage = await premiumRequired("channel_profile")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await channelProfile(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
