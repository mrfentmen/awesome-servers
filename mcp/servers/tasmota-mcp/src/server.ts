import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { fullStatus, readSensor, setPower, TasmotaError, mqttTopics, cmndPayload } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "tasmota-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "status",
    {
      title: "Device status",
      description: "Tasmota device info, power state, uptime, wifi. Set TASMOTA_URL for your device.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await fullStatus())
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "set_power",
    {
      title: "Set power",
      description: "Switch a Tasmota outlet on, off, or toggle. Point TASMOTA_URL at each device.",
      inputSchema: z.object({
        state: z.enum(["on", "off", "toggle"]).default("toggle"),
        outlet: z.number().int().min(1).max(8).default(1),
      }),
      annotations: WRITE,
    },
    async ({ state, outlet }) => {
      try {
        return text(await setPower(state, outlet))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "read_sensor",
    {
      title: "Read sensors",
      description: "Sensor readings (temperature, humidity, energy...) if the device has sensors.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await readSensor())
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "mqtt_topics",
    {
      title: "Work out MQTT topics",
      description: "Work out the publish, subscribe and telemetry topics a Tasmota device uses, from its name, %prefix%/%topic% and %full_topic% options, plus which Status N payload lands on which topic. No device or network needed.",
      inputSchema: z.object({
        device_name: z.string().optional().describe("Device name, usually tasmota_<last 6 of the MAC>"),
        topic: z.string().optional().describe("%topic% option, default the device name"),
        prefix: z.string().optional().describe("%prefix% option, default %prefix%"),
        suffix: z.string().optional().describe("Extra %suffix% on the full topic"),
        full_topic: z.string().optional().describe("Explicit %full_topic% to resolve, e.g. tasmota/%topic%/"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mqttTopics(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "cmnd_payload",
    {
      title: "Build a command payload",
      description: "Turn a sequence of intentions (power, dimmer, speed, colour, colour temperature, delays) into the exact Tasmota JSON command body and request URL, with out-of-range values clamped or rejected. Built locally, not sent.",
      inputSchema: z.object({
        steps: z.array(z.object({
          power: z.enum(["on", "off", "toggle"]).optional().describe("Relay state for this step"),
          outlet: z.number().int().min(1).max(8).optional().describe("Outlet 1-8, default 1"),
          dimmer: z.number().int().min(0).max(100).optional().describe("Brightness percent"),
          speed: z.number().int().min(0).max(10).optional().describe("Transition speed 0-10"),
          color: z.string().optional().describe("RRGGBB hex colour"),
          color_temp: z.number().int().optional().describe("Colour temperature 1530-9000K, 0 resets"),
          delay: z.number().int().min(0).max(3600).optional().describe("Pause in seconds before this step's fields"),
        })).describe("Steps in execution order"),
        url: z.string().optional().describe("Device base URL for the request line, default TASMOTA_URL"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cmndPayload(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TasmotaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
