import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  compareVehicles,
  errorMessage,
  formatVehicle,
  fuelPrices,
  listMakes,
  listModels,
  listOptions,
  listYears,
  vehicleDetails,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const YEAR = z.string().describe("Model year, e.g. '2024'")
const MAKE = z.string().describe("Make, e.g. 'Toyota'")
const MODEL = z.string().describe("Model, e.g. 'Camry'")

function menu(list: Array<{ text: string; value: string }>, label: string, limit = 120): string {
  if (list.length === 0) return `No ${label} found.`
  const shown = list.slice(0, limit)
  const lines = shown.map((i) => `  ${i.text}${i.value !== i.text ? `  (${i.value})` : ""}`)
  const more = list.length > shown.length ? `\n  ... ${list.length - shown.length} more` : ""
  return `${list.length} ${label}:\n\n${lines.join("\n")}${more}`
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fueleconomy-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_years",
    {
      title: "List model years",
      description: "Model years the US fuel economy database covers. Start here when you know nothing else.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const years = await listYears()
        return text(`Model years available:\n\n${years.map((y) => `  ${y}`).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_makes",
    {
      title: "List makes",
      description: "Every car make with EPA data for a model year.",
      inputSchema: z.object({ year: YEAR }),
      annotations: READ_ONLY,
    },
    async ({ year }) => {
      try {
        return text(menu(await listMakes(year), `makes for ${year}`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_models",
    {
      title: "List models",
      description: "Models a make sold in a given model year.",
      inputSchema: z.object({ year: YEAR, make: MAKE }),
      annotations: READ_ONLY,
    },
    async ({ year, make }) => {
      try {
        return text(menu(await listModels(year, make), `${make} models for ${year}`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_options",
    {
      title: "List trims and vehicle ids",
      description:
        "Trims/engines for a model, each with the vehicle id needed by vehicle_details.",
      inputSchema: z.object({ year: YEAR, make: MAKE, model: MODEL }),
      annotations: READ_ONLY,
    },
    async ({ year, make, model }) => {
      try {
        return text(menu(await listOptions(year, make, model), `${year} ${make} ${model} options`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "vehicle_details",
    {
      title: "Vehicle details",
      description:
        "Full EPA record for one vehicle id: MPG city/highway/combined, CO2, annual fuel cost, engine, class and scores.",
      inputSchema: z.object({
        vehicle_id: z.string().describe("Vehicle id from list_options, e.g. '46748'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ vehicle_id }) => {
      try {
        return text(formatVehicle(await vehicleDetails(vehicle_id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "compare_vehicles",
    {
      title: "Compare vehicles",
      description:
        "Compare up to 6 vehicles side by side on MPG, CO2 and running cost, and name the most efficient one.",
      inputSchema: z.object({
        vehicle_ids: z.string().describe("Comma-separated vehicle ids, e.g. '46748, 45001'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ vehicle_ids }) => {
      try {
        return text(await compareVehicles(vehicle_ids.split(",")))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "fuel_prices",
    {
      title: "Fuel prices",
      description:
        "Current US national average prices for regular, midgrade, premium, diesel, E85, CNG, LPG and electricity.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await fuelPrices())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
