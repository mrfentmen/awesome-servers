import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getInfo,
  getState,
  setPower,
  getEffects,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const NON_READ_ONLY = { openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nanoleaf-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_info",
    {
      title: "Get panel info",
      description: "Nanoleaf model, firmware, layout and current state snapshot.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getInfo());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_state",
    {
      title: "Get power state",
      description: "Nanoleaf on/off, brightness, hue, saturation, color temperature.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getState());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "set_power",
    {
      title: "Set power",
      description: "Turn Nanoleaf panels on or off.",
      inputSchema: z.object({
        on: z.boolean().describe("True for on, false for off"),
      }),
      annotations: NON_READ_ONLY,
    },
    async ({ on }) => {
      try {
        return text(await setPower(on));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_effects",
    {
      title: "Get effects",
      description: "Nanoleaf installed effects and the active one.",
      inputSchema: z.object({
      }),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getEffects());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
