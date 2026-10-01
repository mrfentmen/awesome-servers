import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { cityLookup } from "./api.js"
import { zipLookup, reverseGeocode } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "zip-codes-mcp", version: "1.0.0" })
  server.registerTool(
    "zip_lookup",
    {
      title: "Zip lookup",
      description: "Get the city and state for a US zip code.",
      inputSchema: z.object( { zip: z.string().describe("Five digit US zip code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await zipLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "city_lookup",
    {
      title: "City lookup",
      description: "List zip codes for a city and state.",
      inputSchema: z.object( { city: z.string().describe("City name."), state: z.string().describe("Two letter state code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await cityLookup(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "reverse_geocode",
    {
      title: "Reverse geocode",
      description: "Turn a latitude and longitude into the post code, city, state and country that OpenStreetMap Nominatim has for that point.",
      inputSchema: z.object( { latitude: z.number().describe("Latitude, -90 to 90."), longitude: z.number().describe("Longitude, -180 to 180.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: reverse_geocode ----
    const paywallMessage = await premiumRequired("reverse_geocode")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await reverseGeocode(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
