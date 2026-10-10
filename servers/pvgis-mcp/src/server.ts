import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareLocations, errorMessage, formatPvYield, hourlyOutput, parseLocation, pvYield, radiation, sizeSystem, systemSummary, typicalWeather, horizonProfile, offgridSizing, optimalTilt } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const LAT = z.string().describe("Latitude, e.g. '45.0'")
const LON = z.string().describe("Longitude, e.g. '8.0'")
const PEAK = z.number().min(0.05).max(100000).describe("Installed peak power in kWp").optional()
const LOSS = z.number().min(0).max(99).describe("System losses in percent (default 14)").optional()
const ANGLE = z.number().min(0).max(90).describe("Panel tilt in degrees; omit for the optimal angle").optional()
const ASPECT = z.number().min(-180).max(180).describe("Panel direction: 0 is south, -90 east, 90 west").optional()

export function createServer(): McpServer {
  const server = new McpServer({
    name: "pvgis-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "pv_yield",
    {
      title: "PV yield",
      description:
        "Monthly and yearly solar output for a location. Give kWp and tilt, or leave tilt out to use the optimal angle.",
      inputSchema: z.object({
        latitude: LAT,
        longitude: LON,
        peakpower: PEAK,
        loss: LOSS,
        angle: ANGLE,
        aspect: ASPECT,
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, peakpower, loss, angle, aspect }) => {
      try {
        const data = await pvYield(latitude, longitude, peakpower, loss, angle, aspect)
        return text(formatPvYield(data, parseLocation(latitude, longitude)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "radiation",
    {
      title: "Solar irradiation",
      description:
        "How much sun a site gets, month by month, on a tilted panel plane - with the year-to-year spread.",
      inputSchema: z.object({ latitude: LAT, longitude: LON, angle: ANGLE, aspect: ASPECT }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, angle, aspect }) => {
      try {
        return text(await radiation(latitude, longitude, angle, aspect))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "hourly_output",
    {
      title: "Hourly series",
      description:
        "Hour-by-hour solar data for one year, summarised by month: average irradiance, sun hours and temperature.",
      inputSchema: z.object({
        latitude: LAT,
        longitude: LON,
        year: z.number().int().min(2005).max(2100).describe("Calendar year to model").optional(),
        peakpower: PEAK,
        loss: LOSS,
        angle: ANGLE,
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, year, peakpower, loss, angle }) => {
      try {
        return text(await hourlyOutput(latitude, longitude, year, peakpower, loss, angle))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "typical_weather",
    {
      title: "Typical weather year",
      description:
        "The typical meteorological year for a site: monthly temperature, humidity, wind speed and global irradiation.",
      inputSchema: z.object({ latitude: LAT, longitude: LON }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude }) => {
      try {
        return text(await typicalWeather(latitude, longitude))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "system_summary",
    {
      title: "System summary",
      description:
        "Plain-language verdict for a PV system: yearly output, yield per kWp, capacity factor, CO2 avoided and roof area.",
      inputSchema: z.object({
        latitude: LAT,
        longitude: LON,
        peakpower: PEAK,
        loss: LOSS,
        angle: ANGLE,
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, peakpower, loss, angle }) => {
      try {
        return text(await systemSummary(latitude, longitude, peakpower, loss, angle))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "compare_locations",
    {
      title: "Compare sites",
      description:
        "Compare up to 5 sites for the same system size and name the best one, e.g. '45,8; 52.5,13.4'.",
      inputSchema: z.object({
        sites: z.string().describe("Semicolon-separated 'lat,lon' pairs, e.g. '45,8; 52.5,13.4'"),
        peakpower: PEAK,
        loss: LOSS,
      }),
      annotations: READ_ONLY,
    },
    async ({ sites, peakpower, loss }) => {
      try {
        return text(await compareLocations(sites, peakpower, loss))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "size_system",
    {
      title: "Size a system",
      description:
        "Work out the system size needed to cover a target annual consumption at a location, with panel count and roof area.",
      inputSchema: z.object({
        latitude: LAT,
        longitude: LON,
        annual_kwh: z.number().min(100).max(10000000).describe("Target annual output in kWh"),
        loss: LOSS,
        angle: ANGLE,
      }),
      annotations: READ_ONLY,
    },
    async ({ latitude, longitude, annual_kwh, loss, angle }) => {
      try {
        return text(await sizeSystem(latitude, longitude, annual_kwh, loss, angle))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "horizon_profile",
    {
      title: "Horizon profile",
      description:
        "What the terrain blocks at a location: obstacle height every 7.5 degrees of azimuth, the steepest obstacle and how much of the southern arc is obstructed.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude, e.g. '41.9'"),
        lon: z.string().describe("Longitude, e.g. '12.5'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon }) => {
      try {
        return text(await horizonProfile(lat, lon))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "offgrid_sizing",
    {
      title: "Off-grid sizing",
      description:
        "Simulate an off-grid array and battery against a real daily load: how often the load is not met, energy thrown away and the month-by-month shortfall.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude, e.g. '41.9'"),
        lon: z.string().describe("Longitude, e.g. '12.5'"),
        peakPower: z.number().describe("Array peak power in Wp, e.g. 1000. Defaults to 1000.").optional(),
        batteryWh: z.number().describe("Battery capacity in Wh, e.g. 5000. Defaults to 5000.").optional(),
        dailyWh: z.number().describe("Daily consumption in Wh, e.g. 3000. Defaults to 3000.").optional(),
        cutoff: z.number().describe("Battery cutoff percentage, e.g. 40. Defaults to 40.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, peakPower, batteryWh, dailyWh, cutoff }) => {
      try {
        return text(await offgridSizing({ lat, lon, peakPower, batteryWh, dailyWh, cutoff }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "optimal_tilt",
    {
      title: "Optimal tilt",
      description:
        "The tilt and azimuth PVGIS calls optimal here, and what a flat 30 degree south mount costs in kWh per kWp per year against it.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude, e.g. '41.9'"),
        lon: z.string().describe("Longitude, e.g. '12.5'"),
        loss: z.number().describe("System loss percentage, e.g. 14. Defaults to 14.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ lat, lon, loss }) => {
      try {
        return text(await optimalTilt({ lat, lon, loss }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "solar_variability",
    {
      title: "Solar resource variability",
      description:
        "How much the solar resource actually varied year to year, month by month, across the whole PVGIS reference period: mean, min, max, standard deviation, coefficient of variation and which year was best and worst.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude, e.g. '48.85'"),
        lon: z.string().describe("Longitude, e.g. '2.35'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: solar_variability ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pvgis_solar_variability", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "diurnal_profile",
    {
      title: "Diurnal solar profile",
      description:
        "The shape of an average day: global irradiation by hour of day split into summer and winter halves, with the direct and diffuse components and a bar chart, so the daylight window and the tracker's recoverable share are both visible.",
      inputSchema: z.object({
        lat: z.string().describe("Latitude, e.g. '52.37'"),
        lon: z.string().describe("Longitude, e.g. '4.89'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: diurnal_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_pvgis_diurnal_profile", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}
