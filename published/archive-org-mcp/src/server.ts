import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_ArchiveError, m0_fmtSize, m0_formatItem, m0_getItemDetails, m0_searchItems, m1_WaybackError, m1_formatSnapshot, m1_getAvailability, m1_getSnapshots, m1_getSnapshotText, searchProfile } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'archive-org-mcp', version: '1.0.0' })
server.registerTool(
    "search_items",
    {
      title: "Search items",
      description: "Search the Internet Archive — old software, abandoned CD-ROM games, " +
      "bootleg concert tapes, 78rpm records, dead web pages, and more.",
      inputSchema: z.object(
    {
      query: z.string().describe("Search query, e.g. 'Windows 95' or 'sonic hedgehog prototype'"),
      mediatype: z
        .enum(["software", "audio", "movies", "texts", "image", "web"])
        .optional()
        .describe("Restrict to a media type"),
      limit: z.number().int().min(1).max(25).default(8),
    }),
      annotations: READ_ONLY,
    },
    async ({ query, mediatype, limit }) => {
      try {
        const items = await m0_searchItems(query, mediatype, limit)
        if (items.length === 0) return text(`Nothing in the Archive matches "${query}".`)
        return text(
          `Archive.org results for "${query}"${mediatype ? ` (${mediatype})` : ""}:\n\n` +
            items.map((it, i) => m0_formatItem(it, i)).join("\n\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "get_item",
    {
      title: "Get item",
      description: "Get full details + file manifest for an archive.org item.",
      inputSchema: z.object(
    { identifier: z.string().describe("Item identifier from search_items") }),
      annotations: READ_ONLY,
    },
    async ({ identifier }) => {
      try {
        const d = await m0_getItemDetails(identifier)
        const lines = [
          d.title ?? d.identifier,
          d.mediatype ? `Type: ${d.mediatype}` : "",
          d.description ? d.description.slice(0, 400) : "",
          `https://archive.org/details/${d.identifier}`,
          "",
          `Files (${d.files.length} shown):`,
          ...d.files.map(
            (f, i) =>
              `${i + 1}. ${f.name}${f.format ? ` [${f.format}]` : ""}${f.size ? ` ${m0_fmtSize(f.size)}` : ""}${f.length ? ` (${f.length})` : ""}`
          ),
        ].filter(Boolean)
        return text(lines.join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "get_snapshots",
    {
      title: "Get snapshots",
      description: "List the Wayback Machine snapshot history for a URL.",
      inputSchema: z.object(
    { url: z.string().describe("Full URL, e.g. 'example.com/page.html'"), limit: z.number().int().min(1).max(25).default(10) }),
      annotations: READ_ONLY,
    },
    async ({ url, limit }) => {
      try {
        const snaps = await m1_getSnapshots(url, limit)
        if (snaps.length === 0) return text(`No archived snapshots of ${url}.`)
        return text(`Snapshots of ${url}:\n\n${snaps.map((s, i) => m1_formatSnapshot(s, i)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "get_availability",
    {
      title: "Get availability",
      description: "Check whether a page is archived and get its closest snapshot.",
      inputSchema: z.object(
    { url: z.string().describe("Full URL") }),
      annotations: READ_ONLY,
    },
    async ({ url }) => {
      try {
        const snap = await m1_getAvailability(url)
        if (!snap) return text(`No archived snapshot of ${url}.`)
        return text(`Closest snapshot of ${url}:\n\n${m1_formatSnapshot(snap)}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "read_snapshot",
    {
      title: "Read snapshot",
      description: "Read the text content of an archived page, for reading dead sites.",
      inputSchema: z.object(
    {
      timestamp: z.string().describe("Snapshot timestamp from get_snapshots, e.g. '20240101120000'"),
      url: z.string().describe("The original URL that was archived"),
      maxChars: z.number().int().min(500).max(50000).default(15000),
    }),
      annotations: READ_ONLY,
    },
    async ({ timestamp, url, maxChars }) => {
      try {
        const content = await m1_getSnapshotText(timestamp, url, maxChars)
        if (!content.trim()) return text(`Snapshot ${timestamp} of ${url} has no readable text.`)
        return text(content)
      } catch (e) {
        return textError(String(e))
      }
    }
  )
  server.registerTool(
    "snapshot_timeline",
    {
      title: "Snapshot timeline",
      description: "The shape of one URL's archived history rather than a list of it: how many successful snapshots exist in a year range, how many distinct content digests they hold, how many captures just repeat a page already archived, the media types captured, the payload size and captures per year. The get_snapshots tool returns the newest few with no digest, no date range and no totals.",
      inputSchema: z.object(
    {
      url: z.string().describe("Full URL, e.g. 'example.com/page.html'"),
      from: z.number().int().min(1996).max(2100).describe("Earliest year to include.").optional(),
      to: z.number().int().min(1996).max(2100).describe("Latest year to include.").optional(),
      limit: z.number().int().min(1).max(3000).default(500).describe("How many snapshots to read, up to 3000."),
    }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement timeline locally (paywall removed)
      try { return textError("Not yet implemented: timeline") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "search_profile",
    {
      title: "Search profile",
      description: "What a search term looks like across the Internet Archive rather than eight rows of it: the catalogue total, the media type split, how many items carry no year, the most common years, the collections involved and the download distribution, with the sample size stated. The search_items tool only prints a short list.",
      inputSchema: z.object(
    {
      query: z.string().describe("Search terms, e.g. 'Windows 95'"),
      mediatype: z.string().describe("Restrict to one media type, e.g. software or audio.").optional(),
      limit: z.number().int().min(10).max(500).default(200).describe("How many items to read for the profile, 10 to 500."),
    }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchProfile(args)) } catch (e) { return textError(String(e)) }
    }
  )
const serverName = "archive-org-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )


  return server
}
