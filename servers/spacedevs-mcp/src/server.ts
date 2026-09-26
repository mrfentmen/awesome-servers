import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  launchCountdown,
  nextLaunches,
  satelliteFrequencies,
  satelliteOrbit,
  satelliteSearch,
  spaceBlogs,
  spaceNews,
  spaceWeather,
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
    "next_launches",
    {
      title: "Upcoming launches",
      description:
        "Upcoming orbital launches worldwide: mission, rocket, provider, pad, T-0 and launch weather. Optionally filter by provider, e.g. 'SpaceX' or 'Rocket Lab'.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(25).default(5).describe("How many launches to show"),
        provider: z.string().describe("Only launches from providers matching this name, e.g. 'SpaceX'").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit, provider }) => {
      try {
        return text(await nextLaunches(limit, provider))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "launch_countdown",
    {
      title: "Next launch countdown",
      description:
        "The single soonest launch with a live countdown, its pad, weather, mission summary, how firm the launch time is, and the three launches after it.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await launchCountdown())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "satellite_search",
    {
      title: "Search satellites",
      description:
        "Search the SatNOGS satellite catalogue by name and see NORAD catalog number, status, operator, country and launch date. Use the NORAD number with satellite_orbit or satellite_frequencies.",
      inputSchema: z.object({
        query: z.string().describe("Satellite name or part of it, e.g. 'ISS', 'NOAA' or 'STARLINK'"),
        limit: z.number().int().min(1).max(25).default(10).describe("How many satellites to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await satelliteSearch(query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "satellite_orbit",
    {
      title: "Satellite orbit details",
      description:
        "Orbital elements for one satellite by NORAD catalog number: inclination, eccentricity, period, apogee, perigee, mean orbital velocity and orbit class. The ISS is 25544.",
      inputSchema: z.object({
        norad_id: z.number().int().positive().describe("NORAD catalog number, e.g. 25544 for the ISS"),
      }),
      annotations: READ_ONLY,
    },
    async ({ norad_id }) => {
      try {
        return text(await satelliteOrbit(norad_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "satellite_frequencies",
    {
      title: "Satellite radio frequencies",
      description:
        "Uplink and downlink frequencies and modes recorded for one satellite, by NORAD catalog number - what you need to receive or work a satellite by radio.",
      inputSchema: z.object({
        norad_id: z.number().int().positive().describe("NORAD catalog number, e.g. 25544 for the ISS"),
        limit: z.number().int().min(1).max(25).default(10).describe("How many transmitters to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ norad_id, limit }) => {
      try {
        return text(await satelliteFrequencies(norad_id, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "space_news",
    {
      title: "Space news",
      description: "Latest spaceflight news headlines from across the industry, with an optional keyword search.",
      inputSchema: z.object({
        query: z.string().describe("Keyword to search for, e.g. 'starship' or 'artemis'").optional(),
        limit: z.number().int().min(1).max(15).default(5).describe("How many stories to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await spaceNews(query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "space_blogs",
    {
      title: "Space blog posts",
      description: "Longer spaceflight write-ups and agency blog posts, with an optional keyword search.",
      inputSchema: z.object({
        query: z.string().describe("Keyword to search for, e.g. 'james webb'").optional(),
        limit: z.number().int().min(1).max(15).default(5).describe("How many posts to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await spaceBlogs(query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "space_weather",
    {
      title: "Space weather",
      description:
        "Current geomagnetic conditions from NOAA: Kp index, solar wind speed, interplanetary magnetic field, NOAA storm scales and the Kp forecast.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await spaceWeather())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
