import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  alerts,
  alertText,
  forecast,
  hourly,
  NwsError,
  observation,
  periodText,
  points,
  stations,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof NwsError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const coords = {
  lat: z.number().min(-90).max(90).describe("Latitude"),
  lon: z.number().min(-180).max(180).describe("Longitude"),
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nws-mcp", version: "1.0.0" })

  server.tool(
    "forecast",
    "Seven-day US forecast for a coordinate, day and night periods.",
    coords,
    async ({ lat, lon }) => {
      try {
        return text((await forecast(lat, lon)).map(periodText).join("\n\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "hourly_forecast",
    "Hourly US forecast for a coordinate, next N hours.",
    { ...coords, hours: z.number().int().min(1).max(72).default(12).describe("Hours to return") },
    async ({ lat, lon, hours }) => {
      try {
        return text((await hourly(lat, lon)).slice(0, hours).map(periodText).join("\n"))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "active_alerts",
    "Active NWS alerts for a US state or marine area code.",
    { area: z.string().max(4).default("").describe("Two-letter state code, e.g. DC; empty for nationwide") },
    async ({ area }) => {
      try {
        const rows = await alerts(area)
        if (!rows.length) return text("No active alerts.")
        return text(`${rows.length} active alert(s)\n\n${rows.slice(0, 15).map(alertText).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "latest_observation",
    "Latest observation from a NWS station, e.g. KDCA.",
    { station: z.string().min(2).describe("Station id, e.g. KDCA") },
    async ({ station }) => {
      try {
        return text(await observation(station))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "nearby_stations",
    "Observation stations nearest a coordinate, with distance.",
    { ...coords, limit: z.number().int().min(1).max(20).default(5).describe("Stations") },
    async ({ lat, lon, limit }) => {
      try {
        const rows = (await stations(lat, lon)).slice(0, limit)
        if (!rows.length) return text("No stations found.")
        return text(
          rows
            .map(
              (s) =>
                `${s.properties?.stationIdentifier} — ${s.properties?.name} @ ${s.geometry?.coordinates?.join(", ")}`
            )
            .join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "point_metadata",
    "NWS forecast office, time zone and relative location for a coordinate.",
    coords,
    async ({ lat, lon }) => {
      try {
        const p = await points(lat, lon)
        const rel = p.relativeLocation?.properties
        return text(
          [
            `city: ${rel?.city ?? "?"}, ${rel?.state ?? "?"}`,
            `forecast office: ${p.forecastOffice ?? "?"}`,
            `time zone: ${p.timeZone ?? "?"}`,
          ].join("\n")
        )
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
