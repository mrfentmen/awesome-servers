import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { coneSearch, formatObs, MastError } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mast-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "cone_search",
    {
      title: "Cone search",
      description: "Space telescope observations (Hubble, Webb, TESS...) near an RA/Dec position.",
      inputSchema: z.object({
        ra: z.number().min(0).max(360).describe("Right ascension in degrees, e.g. 83 for Orion"),
        dec: z.number().min(-90).max(90).describe("Declination in degrees, e.g. -5"),
        radius: z.number().min(0.01).max(5).default(0.1).describe("Radius in degrees"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ ra, dec, radius, limit }) => {
      try {
        const rows = await coneSearch(ra, dec, radius, limit)
        if (rows.length === 0) return text("No observations near this position.")
        return text(rows.map((o, i) => formatObs(o, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )


  server.registerTool(
    "resolve_name",
    {
      title: "Resolve name",
      description: "Resolve a target name such as M51 or Betelgeuse to coordinates and object type through MAST's name resolver, which is how you turn a name into a position for a cone search.",
      inputSchema: z.object( { name: z.string().describe("Target name, e.g. M51."), limit: z.number().describe("Max candidates.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement name locally (paywall removed)
    try { return textError("Not yet implemented: name") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MastError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
