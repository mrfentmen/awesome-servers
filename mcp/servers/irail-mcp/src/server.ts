import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { connections, stations, trainStops } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "irail-mcp", version: "1.0.0" })
  server.registerTool(
    "stations",
    {
      title: "Stations",
      description: "List stations.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stations(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "connections",
    {
      title: "Connections",
      description: "Connections between stations.",
      inputSchema: z.object( { from: z.string().describe("Origin station."), to: z.string().describe("Destination station."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await connections(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "live_board",
    {
      title: "Live board",
      description: "Live departure board for a station: scheduled and delayed times, train number, destination, platform, cancellation and occupancy level.",
      inputSchema: z.object( { station: z.string().describe("Station name or id, e.g. 'Brussels-Central'."), limit: z.number().describe("Max departures.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement board locally (paywall removed)
    try { return textError("Not yet implemented: board") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "network_disruptions",
    {
      title: "Network disruptions",
      description: "Current planned and unplanned works and disruptions across the whole Belgian rail network, with Infrabel's own description.",
      inputSchema: z.object( { limit: z.number().describe("Max disruptions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement disruptions locally (paywall removed)
    try { return textError("Not yet implemented: disruptions") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "train_stops",
    {
      title: "Train stops",
      description: "Every remaining stop of one train: time, delay, platform, occupancy level and whether it has already departed. Takes a vehicle id from the live_board or connections output.",
      inputSchema: z.object( { id: z.string().describe("Vehicle id, e.g. 'BE.NMBS.IC3433'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await trainStops(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
