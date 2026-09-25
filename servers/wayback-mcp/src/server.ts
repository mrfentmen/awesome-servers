import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  WaybackError,
  formatSnapshot,
  getAvailability,
  getSnapshots,
  getSnapshotText,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "wayback-mcp",
    version: "1.0.0",
  })

  server.tool(
    "get_snapshots",
    "List the Wayback Machine snapshot history for a URL.",
    { url: z.string().describe("Full URL, e.g. 'example.com/page.html'"), limit: z.number().int().min(1).max(25).default(10) },
    async ({ url, limit }) => {
      try {
        const snaps = await getSnapshots(url, limit)
        if (snaps.length === 0) return text(`No archived snapshots of ${url}.`)
        return text(`Snapshots of ${url}:\n\n${snaps.map((s, i) => formatSnapshot(s, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_availability",
    "Check whether a page is archived and get its closest snapshot.",
    { url: z.string().describe("Full URL") },
    async ({ url }) => {
      try {
        const snap = await getAvailability(url)
        if (!snap) return text(`No archived snapshot of ${url}.`)
        return text(`Closest snapshot of ${url}:\n\n${formatSnapshot(snap)}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "read_snapshot",
    "Read the text content of an archived page, for reading dead sites.",
    {
      timestamp: z.string().describe("Snapshot timestamp from get_snapshots, e.g. '20240101120000'"),
      url: z.string().describe("The original URL that was archived"),
      maxChars: z.number().int().min(500).max(50000).default(15000),
    },
    async ({ timestamp, url, maxChars }) => {
      try {
        const content = await getSnapshotText(timestamp, url, maxChars)
        if (!content.trim()) return text(`Snapshot ${timestamp} of ${url} has no readable text.`)
        return text(content)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof WaybackError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
