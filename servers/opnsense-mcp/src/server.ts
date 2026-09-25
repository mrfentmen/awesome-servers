import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  getFirmwareStatus,
  getInterfaces,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opnsense-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_firmware_status",
    {
      title: "Firmware status",
      description: "Version and update state.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getFirmwareStatus());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_interfaces",
    {
      title: "Interface stats",
      description: "Traffic counters per interface.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getInterfaces());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}