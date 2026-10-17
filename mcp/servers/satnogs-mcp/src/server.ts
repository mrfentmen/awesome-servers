import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { byMode, transmitters, band_survey } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "satnogs-mcp", version: "1.0.0" })
  server.registerTool(
    "transmitters",
    {
      title: "Transmitters",
      description: "List satellite transmitters.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await transmitters(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "by_mode",
    {
      title: "By mode",
      description: "Transmitters by mode.",
      inputSchema: z.object( { mode: z.string().describe("Mode like FM or CW."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await byMode(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "satellite_transmitters",
    {
      title: "Satellite transmitters",
      description: "List every transmitter the SatNOGS database files against one satellite, given its NORAD catalogue id, with each one's downlink and uplink frequency, mode, type and status, plus how many are active and which modes and types that satellite uses. The existing tools list the head of the whole table and can only narrow it by mode, so there is no way with them to ask what is on a given satellite.",
      inputSchema: z.object({
        noradId: z.number().int().min(1).max(60000).describe("NORAD catalogue id, for instance 25544 for the ISS. The table covers 2,600-odd ids."),
        limit: z.number().int().min(1).max(100).optional().describe("How many transmitters to list, lowest downlink first. Default 25."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement transmitters locally (paywall removed)
      try { return textError("Not yet implemented: transmitters") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "frequency_search",
    {
      title: "Frequency search",
      description: "Find every SatNOGS transmitter whose downlink band overlaps a frequency window in MHz, optionally restricted to one mode or to active transmitters only, and report how many match, which modes and how many distinct satellites are in range and whether one satellite dominates the window. A wideband beacon counts as in range when it straddles the window rather than only when its centre falls inside. The existing byMode tool narrows by mode only and cannot ask what is on a frequency.",
      inputSchema: z.object({
        lowMhz: z.number().positive().describe("Lower edge of the downlink window in MHz, for instance 145."),
        highMhz: z.number().positive().optional().describe("Upper edge in MHz. Defaults to lowMhz, which searches a single frequency."),
        mode: z.string().optional().describe("Restrict to one mode, for example FM or BPSK."),
        activeOnly: z.boolean().optional().describe("Only count transmitters the database lists as active."),
        limit: z.number().int().min(1).max(50).optional().describe("How many to list, lowest downlink first. Default 20."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement search locally (paywall removed)
      try { return textError("Not yet implemented: search") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "band_survey",
    {
      title: "Band survey",
      description: "Report the whole SatNOGS transmitter table as a distribution rather than a list: how many are active, the breakdown by transmitter type, service and mode, a histogram of downlink frequencies across the radio bands from below 30 MHz to above 10 GHz, and how many reported frequencies look like placeholder entries. Optionally narrowed to one service. The existing tools print at most 25 rows and none of these totals.",
      inputSchema: z.object({
        service: z.string().optional().describe("Narrow to one service, for example Amateur, Meteorological or Space Operation."),
        limit: z.number().int().min(5).max(40).optional().describe("How many modes to list. Default 15."),
      }),
      annotations: READ_ONLY,
    },
    async ({ service, limit }) => {
      try { return text(await band_survey({ service, limit })) } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "satellite_status",
    {
      title: "Satellite status",
      description: "The SatNOGS satellite catalogue record for a satellite: status, launch and decay dates, operator, countries, reception status, telemetry decoders and associated satellites. The transmitter tools read /transmitters/; this reads /satellites/.",
      inputSchema: z.object( { satellite: z.string().describe("NORAD catalogue id or satellite name, e.g. 25544 or ISS."), limit: z.number().int().describe("Max matches to show.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement status locally (paywall removed)
    try { return textError("Not yet implemented: status") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
