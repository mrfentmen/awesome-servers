import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getAirQuality,
  getStationAir,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "seoul-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_air_quality",
    {
      title: "Get city air quality",
      description: "Real-time Seoul air quality for all 25 districts: PM10, PM2.5, ozone, NO2, grades.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getAirQuality());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_station_air",
    {
      title: "Get district air quality",
      description: "Air quality for one Seoul district (gu), e.g. Gangnam-gu, Mapo-gu, Jongno-gu.",
      inputSchema: z.object({
        gu: z.string().describe("District name, e.g. 'Gangnam-gu'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ gu }) => {
      try {
        return text(await getStationAir(gu));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
