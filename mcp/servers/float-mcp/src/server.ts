import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { bitsToFloat, floatInfo, nextFloat, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "float-mcp", version: "1.0.0" })

  server.tool(
    "float_info",
    "Full IEEE-754 breakdown of a number: f64 bits, sign/exponent/mantissa, f32 behaviour, rounding notes and the next representable values.",
    {
      value: z.string().describe('Number as text, e.g. 0.1 or 1.5e300')
    },
    async (a) => {
      try {
        return text(await floatInfo(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "bits_to_float",
    "Interpret hex bits as an IEEE-754 float, 32 or 64 bits wide.",
    {
      bits: z.string().describe('Hex bits, with or without 0x'), width: z.number().int().min(32).max(64).optional().describe('32 or 64, default 64')
    },
    async (a) => {
      try {
        return text(await bitsToFloat(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  server.tool(
    "next_float",
    "Step a value to the next representable float, one or many ULPs up or down.",
    {
      value: z.string().describe('Number as text'), steps: z.number().int().min(-1000).max(1000).optional().describe('ULPs to move, default 1')
    },
    async (a) => {
      try {
        return text(await nextFloat(a))
      } catch (e) {
        return { content: [{ type: "text" as const, text: errorMessage(e) }], isError: true }
      }
    }
  )

  return server
}
