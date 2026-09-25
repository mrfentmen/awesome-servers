import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  pvYield,
  radiation,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pvgis-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "pv_yield",
    {
      title: "PV yield",
      description: "Yearly/monthly PV output for a roof.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude."),
        lon: z.string().describe("Longitude."),
        peakpower: z.string().describe("kWp (default 1).").optional(),
        loss: z.string().describe("System loss % (default 14).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, peakpower, loss }) => {
      try {
        return text(await pvYield(lat, lon, peakpower, loss));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "radiation",
    {
      title: "Solar radiation",
      description: "Monthly irradiation averages.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude."),
        lon: z.string().describe("Longitude.")
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await radiation(lat, lon));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}