import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { offices, projects, project, levels, time_series, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "usace-water-mcp", version: "1.0.0" })

  server.tool(
    "offices",
    "USACE water management offices",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await offices(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "projects",
    "Reservoirs and other projects for one office",
    {
      office: z.string().min(2).describe("Office code, e.g. SWT"),
      limit: z.number().int().min(1).max(100).default(30).describe("Maximum projects")
    },
    async (a) => {
      try {
        return text(await projects(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "project",
    "One reservoir or project by name",
    {
      office: z.string().min(2).describe("Office code, e.g. SWT"),
      name: z.string().min(2).describe("Project location name, e.g. ALTU")
    },
    async (a) => {
      try {
        return text(await project(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "levels",
    "Gauge levels recorded for an office",
    {
      office: z.string().min(2).describe("Office code, e.g. SWT"),
      unit: z.enum(["EN", "SI"]).default("EN").describe("EN feet or SI metres"),
      limit: z.number().int().min(1).max(100).default(25).describe("Maximum gauges")
    },
    async (a) => {
      try {
        return text(await levels(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "time_series",
    "Read one CWMS time series between two dates",
    {
      office: z.string().min(2).describe("Office code, e.g. SWT"),
      name: z.string().min(6).describe("Time series id, e.g. ALTU.Stor.Inst.1Hour.0.Ccp-Rev"),
      begin: z.string().min(8).describe("Start date, e.g. 2025-01-01"),
      end: z.string().min(8).describe("End date, e.g. 2025-01-05")
    },
    async (a) => {
      try {
        return text(await time_series(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
