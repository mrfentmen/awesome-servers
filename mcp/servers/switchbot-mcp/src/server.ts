import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listDevices,
  getDeviceStatus,
  sendCommand,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "switchbot-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_devices",
    {
      title: "List devices",
      description: "All SwitchBot devices: bots, curtains, meters, plugs, locks, cameras with ids and types.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDevices());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_device_status",
    {
      title: "Get device status",
      description: "Live SwitchBot device status: temperature, humidity, battery, on/off, position.",
      inputSchema: z.object({
        deviceId: z.string().describe("Device id from list_devices"),
      }),
      annotations: READ_ONLY,
    },
    async ({ deviceId }) => {
      try {
        return text(await getDeviceStatus(deviceId));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "send_command",
    {
      title: "Send device command",
      description: "Control a SwitchBot device: turnOn/turnOff, press, setPosition, setBrightness and more.",
      inputSchema: z.object({
        deviceId: z.string().describe("Device id"),
        command: z.string().describe("Command, e.g. 'turnOn', 'press'"),
        parameter: z.string().default("default").describe("Command parameter"),
        commandType: z.string().default("command").describe("Usually 'command'"),
      }),
      annotations: NON_READ_ONLY,
    },
    async ({ deviceId, command, parameter, commandType }) => {
      try {
        return text(await sendCommand(deviceId, command, parameter, commandType));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
