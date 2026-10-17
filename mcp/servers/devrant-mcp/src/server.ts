import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { rants, rantDigest } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "devrant-mcp", version: "1.0.0" })
  server.registerTool(
    "rants",
    {
      title: "Rants",
      description: "Get recent rants.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rants(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "rant_details",
    {
      title: "Rant details",
      description: "One devRant rant opened in full: the author and their score, the real score, the tags, the links embedded in the text, whether it is marked special or edited, and the whole comment thread ranked by score with the ten best shown. The rants tool prints one truncated line per rant and never opens one.",
      inputSchema: z.object( { rant_id: z.number().describe("Rant id, like 194632."), app: z.number().describe("devRant app id, 3 is the public one.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement details locally (paywall removed)
    try { return textError("Not yet implemented: details") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "rant_digest",
    {
      title: "Rant digest",
      description: "The totals for one page of devRant rants rather than a list of them: the score and comment distribution with highest, median and lowest, how many rants carry no comments at all, how many are special or edited or have an image, the post time span, the tag tally and the most active authors. The rants tool prints rows, never totals.",
      inputSchema: z.object( { app: z.number().describe("devRant app id, 3 is the public one.").optional(), sort: z.string().describe("algo, new, hot or top.").optional(), limit: z.number().describe("How many rants to fetch, 1 to 50.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rantDigest(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
