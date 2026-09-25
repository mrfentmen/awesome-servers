import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  drivers,
  constructors,
  schedule,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jolpica-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "drivers",
    {
      title: "Driver standings",
      description: "Championship standings.",
      inputSchema: z.object({
        season: z.string().describe("Year or current (default current).").optional(),
        limit: z.string().describe("Max results (default 10, max 30).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ season, limit }) => {
      try {
        return text(await drivers(season, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "constructors",
    {
      title: "Constructor standings",
      description: "Team standings.",
      inputSchema: z.object({
        season: z.string().describe("Year or current (default current).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ season }) => {
      try {
        return text(await constructors(season));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "schedule",
    {
      title: "Season schedule",
      description: "Races calendar.",
      inputSchema: z.object({
        season: z.string().describe("Year or current (default current).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ season }) => {
      try {
        return text(await schedule(season));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}