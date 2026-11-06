import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { issNow, peopleInSpace } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "open-notify-mcp", version: "1.0.0" })

  server.tool(
    "iss_now",
    "Current latitude and longitude of the ISS",
    {  },
    async ({  }) => {
      try {
        return text(await issNow())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "people_in_space",
    "People currently in space and their craft",
    {  },
    async ({  }) => {
      try {
        return text(await peopleInSpace())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
