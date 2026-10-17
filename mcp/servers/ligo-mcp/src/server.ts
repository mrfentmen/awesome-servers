import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formatEvent, getEvent, LigoError, listCatalogs, listEvents, dataSegments } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ligo-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_events",
    {
      title: "List GW events",
      description: "Gravitational-wave events of a catalog (GWTC, O3a...).",
      inputSchema: z.object({
        catalog: z.string().default("GWTC").describe("Catalog, e.g. 'GWTC', 'GWTC-3', 'O3a' (use list_catalogs)"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ catalog, limit }) => {
      try {
        const rows = await listEvents(catalog, limit)
        if (rows.length === 0) return text(`No events in ${catalog}.`)
        return text(rows.map((e, i) => formatEvent(e, i)).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_event",
    {
      title: "Get event",
      description: "One gravitational-wave event: catalog, GPS time, data link.",
      inputSchema: z.object({
        name: z.string().describe("Event name, e.g. 'GW150914'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(await getEvent(name))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_catalogs",
    {
      title: "List catalogs",
      description: "Known GWOSC catalog names for list_events.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text((await listCatalogs()).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "event_parameters",
    {
      title: "Event parameters",
      description: "The measured source properties of one gravitational-wave event: component and total masses, chirp mass, effective spin, luminosity distance, redshift, probability of astrophysical origin, false alarm rate and SNR, with uncertainty bands.",
      inputSchema: z.object({
        name: z.string().describe("Event name, e.g. GW150914"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement parameters locally (paywall removed)
      try { return textError("Not yet implemented: parameters") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "strain_files",
    {
      title: "Strain files",
      description: "Download links and metadata for detector strain files of a specific GWOSC event release.",
      inputSchema: z.object({ catalog: z.string().min(1).max(80).default("GWTC-1-confident"), name: z.string().default("GW150914"), version: z.number().int().min(1).max(100).default(3), detector: z.enum(["H1", "L1", "V1", "K1"]).optional(), limit: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement files locally (paywall removed)
    try { return textError("Not yet implemented: files") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "data_segments",
    {
      title: "Data segments",
      description: "Available detector data segments and coverage in a bounded GPS time window from the GWOSC timeline API.",
      inputSchema: z.object({ dataset: z.string().default("O1"), detector: z.enum(["H1", "L1", "V1", "K1"]).default("H1"), start: z.number().int().min(1).max(3000000000).describe("GPS start time."), duration: z.number().int().min(1).max(86400).default(32), limit: z.number().int().min(1).max(50).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dataSegments(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LigoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
