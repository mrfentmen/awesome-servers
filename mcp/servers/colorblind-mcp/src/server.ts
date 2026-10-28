import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { colorDistance, simulateColor, simulatePalette, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "colorblind-mcp", version: "1.0.0" })

  server.tool(
    "simulate_color",
    "Show how one hex colour appears with a given colour-vision deficiency.",
    {
      hex: z.string().describe("Hex colour like #ff8800"),
      type: z.enum(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]).describe("Deficiency to simulate")
    },
    async (a) => {
      try {
        return text(await simulateColor(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "simulate_palette",
    "Simulate a whole palette and flag pairs that become hard to tell apart.",
    {
      colors: z.array(z.string()).min(2).max(20).describe("Hex colours"),
      type: z.enum(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]).default("deuteranopia").describe("Deficiency to simulate")
    },
    async (a) => {
      try {
        return text(await simulatePalette(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "color_distance",
    "Perceptual distance between two colours, before and after simulation.",
    {
      first: z.string().describe("First hex colour"),
      second: z.string().describe("Second hex colour"),
      type: z.enum(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]).default("deuteranopia").describe("Deficiency to simulate")
    },
    async (a) => {
      try {
        return text(await colorDistance(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
