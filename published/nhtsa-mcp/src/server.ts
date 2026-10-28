import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { NhtsaError, complaints, decodeVin, listMakes, listModels, recalls } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof NhtsaError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "nhtsa-mcp", version: "1.0.0" })
  const make = z.string().min(2).describe("Make, e.g. honda")
  const model = z.string().min(2).describe("Model, e.g. accord")
  const year = z.number().int().min(1949).max(2100).describe("Model year, e.g. 2015")

  server.tool(
    "decode_vin",
    "Decode a 17-character VIN into make, model, year, engine, plant and more.",
    { vin: z.string().min(11).describe("17-character VIN, e.g. 5UXWX7C5*BA (wildcards allowed)") },
    async ({ vin }) => {
      try {
        return text(await decodeVin(vin))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "vehicle_recalls",
    "Every NHTSA safety recall for a make, model and year, with risk and fix.",
    { make, model, year },
    async ({ make: mk, model: md, year: yr }) => {
      try {
        return text(await recalls(mk, md, yr))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "vehicle_complaints",
    "Owner complaints filed with NHTSA, with crash, fire and injury counts.",
    { make, model, year },
    async ({ make: mk, model: md, year: yr }) => {
      try {
        return text(await complaints(mk, md, yr))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "makes_with_recalls",
    "Vehicle makes that have recalls in a model year.",
    { year },
    async ({ year: yr }) => {
      try {
        return text(await listMakes(yr))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "models_with_recalls",
    "Models for one make that have recalls in a model year.",
    { make, year },
    async ({ make: mk, year: yr }) => {
      try {
        return text(await listModels(mk, yr))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
