import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { top_ports, port_detail, ports_in_state, port_trend, cargo_types, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "port-throughput-mcp", version: "1.0.0" })

  server.tool(
    "top_ports",
    "Busiest ports by cargo volume",
    {
      year: z.number().int().min(2000).max(2030).default(2023).describe("Reporting year"),
      cargoType: z.string().min(3).optional().describe("Cargo type filter, e.g. CONTAINER"),
      limit: z.number().int().min(1).max(25).default(10).describe("Ports to return")
    },
    async (a) => {
      try {
        return text(await top_ports(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "port_detail",
    "All cargo rows for one port in a year",
    {
      portId: z.string().min(2).describe("Port id, e.g. 4820"),
      year: z.number().int().min(2000).max(2030).default(2023).describe("Reporting year"),
      limit: z.number().int().min(1).max(40).default(15).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await port_detail(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "ports_in_state",
    "Ports in a US state",
    {
      state: z.string().min(2).describe("State name, e.g. Texas"),
      year: z.number().int().min(2000).max(2030).default(2023).describe("Reporting year"),
      limit: z.number().int().min(1).max(25).default(10).describe("Ports to return")
    },
    async (a) => {
      try {
        return text(await ports_in_state(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "port_trend",
    "Year-by-year volume trend for one port",
    {
      portId: z.string().min(2).describe("Port id, e.g. 4820"),
      cargoType: z.string().min(3).optional().describe("Cargo type filter, e.g. CONTAINER"),
      limit: z.number().int().min(1).max(30).default(12).describe("Rows to return")
    },
    async (a) => {
      try {
        return text(await port_trend(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cargo_types",
    "Cargo types and units tracked by the dataset",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await cargo_types(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
