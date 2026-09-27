import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { crew, distanceFrom, errorMessage, formatCrew, formatPosition, groundSpeed, orbitSummary, overheadNow, passes, position, groundTrack, viewingWindow } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const LAT = z.string().describe("Latitude, e.g. '40.7128' for New York")
const LON = z.string().describe("Longitude, e.g. '-74.0060' for New York")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "iss-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "iss_position",
    {
      title: "ISS position now",
      description:
        "Where the International Space Station is right now: latitude, longitude, altitude, speed and daylight.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(formatPosition(await position()))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "crew",
    {
      title: "Who is in space",
      description: "Everyone currently in space, grouped by the spacecraft they launched on.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(formatCrew(await crew()))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "distance_from",
    {
      title: "Distance to the ISS",
      description:
        "How far the ISS is from a point on the ground right now, which way to look, and whether it is overhead.",
      inputSchema: z.object({ latitude: LAT, longitude: LON }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude }) => {
      try {
        return text(await distanceFrom(latitude, longitude))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "overhead_now",
    {
      title: "Is the ISS overhead",
      description: "Yes/no on whether the ISS is currently within a radius of a location.",
      inputSchema: z.object({
        latitude: LAT,
        longitude: LON,
        radius_km: z.number().int().min(50).max(5000).default(1000).describe("Search radius in km"),
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, radius_km }) => {
      try {
        return text(await overheadNow(latitude, longitude, radius_km))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "passes",
    {
      title: "Upcoming passes",
      description:
        "Overhead windows for a location over the next N minutes, based on sampled ISS positions. " +
        "Use 120 minutes for the best chance of catching a pass.",
      inputSchema: z.object({
        latitude: LAT,
        longitude: LON,
        minutes: z.number().int().min(10).max(120).default(90).describe("How far ahead to look, in minutes"),
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, minutes }) => {
      try {
        return text(await passes(latitude, longitude, minutes))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ground_speed",
    {
      title: "Ground track speed",
      description:
        "How far the ISS moved in the last minute, its heading, and why the ground speed is slower than the orbital speed.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await groundSpeed())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "orbit_summary",
    {
      title: "Orbit summary",
      description:
        "ISS orbit at a glance: altitude, orbital speed, period in minutes, orbits per day and ground coverage.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await orbitSummary())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "ground_track",
    {
      title: "Ground track",
      description: "Where the ISS flies over the next one to three hours: position table, daylight/eclipse state and start and end points.",
      inputSchema: z.object({
        minutes: z.number().describe("How far ahead to project, 30-180 (default 90).").optional(),
        step_minutes: z.number().describe("Minutes between samples, 1-15 (default 5).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await groundTrack(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "viewing_window",
    {
      title: "Viewing window",
      description: "Can you see the ISS from here? Combines the closest approach, twilight times and whether the station is sunlit.",
      inputSchema: z.object({
        latitude: z.string().describe("Observer latitude, e.g. 40.7128."),
        longitude: z.string().describe("Observer longitude, e.g. -74.0060."),
        date: z.string().describe("YYYY-MM-DD for the twilight times (default today).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await viewingWindow(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
