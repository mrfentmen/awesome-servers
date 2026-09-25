import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listMakes,
  listModels,
  listOptions,
  getMpg,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fueleconomy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_makes",
    {
      title: "List makes",
      description: "Makes for a model year.",
      inputSchema: z.object({
        year: z.string().describe("e.g. 2024.")
      }),
      annotations: READ_ONLY,
    },
    async ({ year }) => {
      try {
        return text(await listMakes(year));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_models",
    {
      title: "List models",
      description: "Models for year + make.",
      inputSchema: z.object({
        year: z.string().describe("e.g. 2024."),
        make: z.string().describe("e.g. Toyota.")
      }),
      annotations: READ_ONLY,
    },
    async ({ year, make }) => {
      try {
        return text(await listModels(year, make));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_options",
    {
      title: "List options",
      description: "Trims/engines for year + make + model.",
      inputSchema: z.object({
        year: z.string().describe("e.g. 2024."),
        make: z.string().describe("e.g. Toyota."),
        model: z.string().describe("e.g. Camry.")
      }),
      annotations: READ_ONLY,
    },
    async ({ year, make, model }) => {
      try {
        return text(await listOptions(year, make, model));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_mpg",
    {
      title: "MPG data",
      description: "Driver-reported MPG for a vehicle ID.",
      inputSchema: z.object({
        vehicle_id: z.string().describe("fueleconomy.gov vehicle ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ vehicle_id }) => {
      try {
        return text(await getMpg(vehicle_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}