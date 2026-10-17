import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { coneSearch, lookupObject, SimbadError, objectIdentifiers } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "simbad-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "lookup_object",
    {
      title: "Look up object",
      description: "Look up an astronomical object by name: id, type, coordinates.",
      inputSchema: z.object({
        ident: z.string().describe("Object name, e.g. 'Vega', 'M31', 'Crab Nebula'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ ident }) => {
      try {
        return text(await lookupObject(ident))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "cone_search",
    {
      title: "Cone search",
      description: "Objects within a sky region by RA/Dec and radius.",
      inputSchema: z.object({
        ra: z.number().min(0).max(360).describe("Right ascension in degrees"),
        dec: z.number().min(-90).max(90).describe("Declination in degrees"),
        radius: z.number().min(0.01).max(5).default(0.1).describe("Radius in degrees"),
        limit: z.number().int().min(1).max(50).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ ra, dec, radius, limit }) => {
      try {
        return text(await coneSearch(ra, dec, radius, limit))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "object_photometry",
    {
      title: "Object photometry",
      description: "SIMBAD flux measurements for one object: filter, flux value, quality flag, photometric system and source bibcode.",
      inputSchema: z.object(
    { ident: z.string().describe("Object name, e.g. 'Vega'"), limit: z.number().int().min(1).max(60).default(20) },
      ),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement photometry locally (paywall removed)
      try { return textError("Not yet implemented: photometry") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "object_references",
    {
      title: "Object references",
      description: "The SIMBAD bibliography for one object: journal, year, title, bibcode and DOI.",
      inputSchema: z.object(
    { ident: z.string().describe("Object name, e.g. 'Vega'"), limit: z.number().int().min(1).max(50).default(15) },
      ),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement references locally (paywall removed)
      try { return textError("Not yet implemented: references") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "object_identifiers",
    {
      title: "Object identifiers",
      description: "Every alternate identifier SIMBAD cross-matches for one object: catalogue names, Gaia, Hipparcos, 2MASS and more.",
      inputSchema: z.object(
    { ident: z.string().describe("Object name, e.g. 'Vega'"), limit: z.number().int().min(1).max(60).default(20) },
      ),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await objectIdentifiers(args))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "object_kinematics",
    {
      title: "Object kinematics",
      description: "SIMBAD spectral type, parallax, proper motion and radial velocity for an exact object identifier. Missing measurements are reported explicitly; no distance is inferred.",
      inputSchema: z.object({ ident: z.string().min(1).max(200).describe("Object identifier, e.g. Vega or M31.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement kinematics locally (paywall removed)
    try { return textError("Not yet implemented: kinematics") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof SimbadError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
