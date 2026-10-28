import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { ny_bridges, ny_bridge_by_bin, ny_bridge_summary, nyc_bridges, nyc_bridge_by_bin, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "bridges-mcp", version: "1.0.0" })

  server.tool(
    "ny_bridges",
    "New York State bridges, optionally by county or poor condition",
    {
      county: z.string().min(3).optional().describe("County name, e.g. Albany"),
      poorOnly: z.boolean().default(false).describe("Only bridges flagged poor"),
      limit: z.number().int().min(1).max(50).default(15).describe("Bridges to return")
    },
    async (a) => {
      try {
        return text(await ny_bridges(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "ny_bridge_by_bin",
    "One New York bridge by BIN",
    {
      bin: z.string().min(6).describe("Bridge BIN, e.g. 3371960")
    },
    async (a) => {
      try {
        return text(await ny_bridge_by_bin(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "ny_bridge_summary",
    "Bridge counts and poor-bridge counts per county",
    {
      limit: z.number().int().min(1).max(62).default(15).describe("Counties to return")
    },
    async (a) => {
      try {
        return text(await ny_bridge_summary(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "nyc_bridges",
    "New York City bridge ratings",
    {
      borough: z.string().min(1).max(2).optional().describe("Borough code: M, B, Q, X or R"),
      belowRating: z.number().min(1).max(7).optional().describe("Only bridges with a current rating below this"),
      limit: z.number().int().min(1).max(50).default(15).describe("Bridges to return")
    },
    async (a) => {
      try {
        return text(await nyc_bridges(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "nyc_bridge_by_bin",
    "One New York City bridge by BIN",
    {
      bin: z.string().min(6).describe("Bridge BIN, e.g. 1065210")
    },
    async (a) => {
      try {
        return text(await nyc_bridge_by_bin(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
