import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  upcoming,
  previous,
  getLaunch,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "spacedevs-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "upcoming",
    {
      title: "Upcoming launches",
      description: "Next rocket launches.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await upcoming(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "previous",
    {
      title: "Past launches",
      description: "Recent past launches.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await previous(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_launch",
    {
      title: "Launch details",
      description: "Details by launch ID.",
      inputSchema: z.object({
        launch_id: z.string().describe("Launch UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ launch_id }) => {
      try {
        return text(await getLaunch(launch_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}