import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatEvent, FrigateError, recentEvents, serverVersion, stats, analyze_events, event_timeline, threshold_advice } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "frigate-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "status",
    {
      title: "Server status",
      description: "Frigate version, uptime, cameras, detection FPS. Set FRIGATE_URL for non-default hosts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(`${await serverVersion()}\n\n${await stats()}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "recent_events",
    {
      title: "Recent events",
      description: "Recent detection events, optionally for one camera.",
      inputSchema: z.object({
        camera: z.string().default("").describe("Camera name, empty = all"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ camera, limit }) => {
      try {
        const rows = await recentEvents(camera, limit)
        if (rows.length === 0) return text("No recent events.")
        return text(rows.map((e, i) => formatEvent(e, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "analyze_events",
    {
      title: "Analyze detections",
      description: "Read a batch of Frigate event objects and summarise what the detections add up to: volume and confidence per label, median and range of each label's scores, how much of each has been reviewed, how much has a saved clip, which cameras each label fires on, and which labels look like false positive candidates because most of their scores sit under 0.50 and none has been reviewed. recent_events prints one line per event and never gathers any of this up.",
      inputSchema: z.object({
        events: z.array(z.object({}).passthrough()).describe("An array of Frigate event objects, the records behind a recent_events call. Only id, camera, label, sub_label, score, top_score, average_score, start_time, end_time, has_clip, has_snapshot, has_been_reviewed and zones are read."),
      }),
      annotations: READ_ONLY,
    },
    async ({ events }) => {
      try { return text(analyze_events({ events })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "event_timeline",
    {
      title: "Incident timeline",
      description: "Group Frigate event objects into incidents, so that detections a few seconds apart on the same camera read as one thing that happened rather than a dozen rows. Reports per camera how many events became how many incidents, the largest incidents with their duration, label and best score, and how much of the raw list the grouping collapsed. recent_events shows the raw list only.",
      inputSchema: z.object({
        events: z.array(z.object({}).passthrough()).describe("An array of Frigate event objects carrying start_time."),
        gapMinutes: z.number().int().min(1).max(180).optional().describe("Gap in minutes on the same camera that still counts as one incident. Default 5."),
      }),
      annotations: READ_ONLY,
    },
    async ({ events, gapMinutes }) => {
      try { return text(event_timeline({ events, gapMinutes })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "threshold_advice",
    {
      title: "Threshold advice",
      description: "Work out where a Frigate confidence threshold should sit for one label or for all of them. Shows how many events survive at each step from 0.20 to 0.95, finds the step where the largest single group disappears, and says how much reviewed material that setting would keep. Also flags events scoring under 0.20, which no threshold can remove. No existing tool touches confidence thresholds.",
      inputSchema: z.object({
        events: z.array(z.object({}).passthrough()).describe("An array of Frigate event objects carrying a confidence figure."),
        threshold: z.number().min(0).max(1).optional().describe("The threshold you are considering, 0 to 1. Default 0.50."),
        label: z.string().optional().describe("Restrict the advice to one label, for example person."),
      }),
      annotations: READ_ONLY,
    },
    async ({ events, threshold, label }) => {
      try { return text(threshold_advice({ events, threshold, label })) } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof FrigateError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
