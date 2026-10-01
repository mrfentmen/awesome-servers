import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listWorkouts,
  getWorkout,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "suunto-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_workouts",
    {
      title: "List workouts",
      description: "Recent Suunto workouts: sport, duration, distance, heart rate, start time.",
      inputSchema: z.object({
        limit: z.number().default(10).describe("How many workouts"),
        offset: z.number().default(0).describe("Paging offset"),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, offset }) => {
      try {
        return text(await listWorkouts(limit, offset));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_workout",
    {
      title: "Get workout detail",
      description: "One Suunto workout summary: samples metadata, laps, zones, totals.",
      inputSchema: z.object({
        workoutId: z.string().describe("Workout id from list_workouts"),
      }),
      annotations: READ_ONLY,
    },
    async ({ workoutId }) => {
      try {
        return text(await getWorkout(workoutId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
