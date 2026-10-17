import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatComic, getComic, latestComic, XkcdError, comic_range } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "xkcd-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "latest_comic",
    {
      title: "Latest comic",
      description: "Get the newest xkcd comic.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(formatComic(await latestComic()))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_comic",
    {
      title: "Get comic",
      description: "Get an xkcd comic by number.",
      inputSchema: z.object(
    { num: z.number().int().min(1).describe("Comic number, e.g. 200") }),
      annotations: READ_ONLY,
    },
    async ({ num }) => {
      try {
        return text(formatComic(await getComic(num)))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "comic_range",
    {
      title: "Comic range",
      description: "Fetch a run of up to forty xkcd comics and list them together: number, date, title, how long the alt text is and whether a transcript exists, with the date span and any numbers that answered 404. Requests are spaced about one a second because xkcd asks for no more than that, and a wider range is refused rather than silently truncated. The existing tools return one comic at a time, so there is no way with them to see what came out over a stretch.",
      inputSchema: z.object({
        from: z.number().int().min(1).describe("First comic number."),
        to: z.number().int().min(1).optional().describe("Last comic number, at most 40 after from. Defaults to from."),
        limit: z.number().int().min(1).max(50).optional().describe("How many rows to list. Default 25."),
      }),
      annotations: READ_ONLY,
    },
    async ({ from, to, limit }) => {
      try { return text(await comic_range({ from, to, limit })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "comic_find",
    {
      title: "Find a term in a range",
      description: "Search a range of xkcd comics for a word or phrase across titles, alt text and transcripts, reporting which comic matched, in which of the three fields, and the surrounding line. xkcd publishes no search index and its own search page answers 404, so this walks the range instead of querying anything remote.",
      inputSchema: z.object({
        from: z.number().int().min(1).describe("First comic number to search from."),
        term: z.string().min(1).max(100).describe("Word or phrase to look for."),
        to: z.number().int().min(1).optional().describe("Last comic number, at most 40 after from. Defaults to from."),
        limit: z.number().int().min(1).max(25).optional().describe("How many mentions to show. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement find locally (paywall removed)
    try { return textError("Not yet implemented: find") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "comic_census",
    {
      title: "Comic census",
      description: "Take content statistics over a range of xkcd comics: how many carry alt text, the shortest, median and longest alt text length, how many carry a transcript or a news item, the spread by year and month, the actual publication cadence, and the longest alt text in full. A median below 100 characters is the usual accessibility complaint about the strip, so the length is reported as a quality signal rather than trivia.",
      inputSchema: z.object({
        from: z.number().int().min(1).describe("First comic number."),
        to: z.number().int().min(1).optional().describe("Last comic number, at most 40 after from. Defaults to from."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement census locally (paywall removed)
    try { return textError("Not yet implemented: census") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "comic_transcript",
    {
      title: "Comic transcripts in full",
      description: "The complete transcript of up to five xkcd comics, with a title and date heading for each, so the whole text can be read rather than the 600 character preview get_comic prints. Comics xkcd has no transcript for say so instead of returning nothing.",
      inputSchema: z.object({ numbers: z.array(z.number()).describe("Comic numbers, e.g. [353, 378]. At most 5."), maxChars: z.number().optional().describe("Characters of transcript to print per comic, 500-40000. Default 12000.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement transcript locally (paywall removed)
    try { return textError("Not yet implemented: transcript") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof XkcdError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
