import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { format, summarize } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const errorText = (error: unknown) => text(`Error: ${error instanceof Error ? error.message : String(error)}`)

export function createServer() {
  const server = new McpServer({ name: "police-transparency-mcp", version: "1.0.0" })
  server.registerTool(
    "summarize_complaints",
    {
      title: "Summarize complaints",
      description: "Return aggregate historical NYPD complaint counts grouped by borough, broad law category, or offense description. No names, addresses, coordinates, demographics, incident rows, live dispatch, or person lookup are exposed.",
      inputSchema: z.object( {
    group: z.enum(["borough", "law_category", "offense"]),
    year: z.number().int().min(2006).max(2030).optional().describe("Historical complaint year; this is not real-time data."),
    borough: z.enum(["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN ISLAND"]).optional(),
    limit: z.number().int().min(1).max(100).default(25),
  }),
      annotations: READ_ONLY,
    },
    async ({ group, year, borough, limit }) => {
    try {
      return text(`DISCLAIMER: This is aggregated historical public data for research, not a live safety feed or individual lookup.\n\n${format(await summarize(group, year, borough, limit))}`)
    } catch (error) { return errorText(error) }
  }
  )
  server.registerTool(
    "use_of_force_summary",
    {
      title: "Use of force summary",
      description: "Aggregate NYPD use-of-force incident counts by force type, optionally for one borough, from the NYPD Use of Force Incidents dataset. Aggregate counts only; no names, addresses, coordinates or incident rows.",
      inputSchema: z.object( {
    borough: z.enum(["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"]).optional(),
    limit: z.number().int().min(1).max(25).default(10),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement summary locally (paywall removed)
    try { return textError("Not yet implemented: summary") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "arrests_by_charge",
    {
      title: "Arrests by charge",
      description: "Aggregate NYPD arrest counts by charge description, optionally for one borough and one year, from the NYPD Arrests Data (Historic) dataset. Aggregate counts only; no names, ages, demographics or arrest rows.",
      inputSchema: z.object( {
    borough: z.enum(["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"]).optional(),
    year: z.number().int().min(2001).max(2030).optional().describe("Arrest year; the dataset only covers 2001 onward."),
    limit: z.number().int().min(1).max(25).default(10),
  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement charge locally (paywall removed)
    try { return textError("Not yet implemented: charge") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
