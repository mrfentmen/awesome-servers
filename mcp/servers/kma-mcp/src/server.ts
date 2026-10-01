import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getForecast,
  getUltrashort,
  getObservations,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "kma-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_forecast",
    {
      title: "Get village forecast",
      description: "KMA 3-day village forecast: temp, rain probability, sky, wind, humidity. Defaults to latest release and Seoul grid.",
      inputSchema: z.object({
        nx: z.number().default(60).describe("Grid X (Seoul 60)"),
        ny: z.number().default(127).describe("Grid Y (Seoul 127)"),
        baseDate: z.string().optional().describe("Base date YYYYMMDD, default latest"),
        baseTime: z.string().optional().describe("Base time HHMM, default latest"),
      }),
      annotations: READ_ONLY,
    },
    async ({ nx, ny, baseDate, baseTime }) => {
      try {
        return text(await getForecast(nx, ny, baseDate, baseTime));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_ultrashort",
    {
      title: "Get ultra-short forecast",
      description: "KMA 6-hour ultra-short forecast for a grid point, updated every 30 minutes.",
      inputSchema: z.object({
        nx: z.number().default(60).describe("Grid X"),
        ny: z.number().default(127).describe("Grid Y"),
      }),
      annotations: READ_ONLY,
    },
    async ({ nx, ny }) => {
      try {
        return text(await getUltrashort(nx, ny));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_observations",
    {
      title: "Get ultra-short observations",
      description: "Latest KMA observations for a grid point: temp, rain, humidity, wind.",
      inputSchema: z.object({
        nx: z.number().default(60).describe("Grid X"),
        ny: z.number().default(127).describe("Grid Y"),
      }),
      annotations: READ_ONLY,
    },
    async ({ nx, ny }) => {
      try {
        return text(await getObservations(nx, ny));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
