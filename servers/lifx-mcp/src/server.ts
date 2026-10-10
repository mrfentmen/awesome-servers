import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatLight, LifxError, listLights, setPower, colorConvert, kelvinSchedule } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "lifx-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_lights",
    {
      title: "List lights",
      description: "LIFX lights with power, brightness, color, online state.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listLights()
        if (rows.length === 0) return text("No lights.")
        return text(rows.map((l, i) => formatLight(l, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "set_power",
    {
      title: "Set power",
      description: "Turn LIFX lights on or off with brightness.",
      inputSchema: z.object({
        selector: z.string().describe("Selector: 'all', 'label:Desk', 'group:Living Room', or light id"),
        power: z.enum(["on", "off", "toggle"]).default("toggle"),
        brightness: z.number().min(0).max(1).default(1).describe("0 (dim) to 1 (full)"),
      }),
      annotations: WRITE,
    },
    async ({ selector, power, brightness }) => {
      try {
        return text(await setPower(selector, power, brightness))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "color_convert",
    {
      title: "Convert a LIFX colour",
      description: "Convert between colour temperature, hex, HSL and LIFX HSBK. Gives the exact set_state payload a LIFX bulb expects, plus the estimated colour temperature of the colour you supplied. Runs entirely on this machine, no bulb or token needed.",
      inputSchema: z.object({
        kelvin: z.number().optional().describe("Colour temperature in kelvin, e.g. 2700"),
        hex: z.string().optional().describe("Hex colour, e.g. #FF8800"),
        hue: z.number().optional().describe("Hue 0-360"),
        saturation: z.number().optional().describe("Saturation 0-1"),
        brightness: z.number().min(0).max(1).optional().describe("Brightness 0-1, default 1"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: color_convert ----
    const paywallMessage = await premiumRequired("color_convert")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await colorConvert(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "kelvin_schedule",
    {
      title: "Plan a colour temperature schedule",
      description: "Interpolate a colour temperature and brightness curve across the day from a few keyframes, rendered as the exact LIFX payloads with the colour each step looks like. Local, no bulb needed.",
      inputSchema: z.object({
        keyframes: z.array(z.object({
          at: z.string().describe("Time of day as HH:MM"),
          kelvin: z.number().describe("Colour temperature at that time"),
          brightness: z.number().describe("Brightness 0-1 at that time"),
        })).describe("At least two keyframes, in any order"),
        start: z.string().optional().describe("Start time HH:MM, default the first keyframe"),
        end: z.string().optional().describe("End time HH:MM, default 24 h after the start"),
        step_minutes: z.number().int().min(5).max(720).default(60).describe("Rows per hour of curve, default 60"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await kelvinSchedule(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LifxError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
