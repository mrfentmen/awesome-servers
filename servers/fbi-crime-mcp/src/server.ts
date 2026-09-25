import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  arrests,
  offenses,
  victims,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fbi-crime-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "arrests",
    {
      title: "Arrest data",
      description: "Arrest estimates by state.",
      inputSchema: z.object({
        state: z.string().describe("Postal code, e.g. AK.")
      }),
      annotations: READ_ONLY,
    },
    async ({ state }) => {
      try {
        return text(await arrests(state));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "offenses",
    {
      title: "Offense data",
      description: "Offense counts by state.",
      inputSchema: z.object({
        state: z.string().describe("Postal code, e.g. AK.")
      }),
      annotations: READ_ONLY,
    },
    async ({ state }) => {
      try {
        return text(await offenses(state));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "victims",
    {
      title: "Victim data",
      description: "Victim demographics by state.",
      inputSchema: z.object({
        state: z.string().describe("Postal code, e.g. AK.")
      }),
      annotations: READ_ONLY,
    },
    async ({ state }) => {
      try {
        return text(await victims(state));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}
