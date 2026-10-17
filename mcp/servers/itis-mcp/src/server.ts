import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { commonNames, formatTaxon, hierarchy, ItisError, searchScientific, synonymReport } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "itis-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_scientific",
    {
      title: "Search scientific names",
      description: "Search ITIS taxonomy by scientific name: TSN, author.",
      inputSchema: z.object({
        name: z.string().describe("Scientific name, e.g. 'Panthera leo'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, limit }) => {
      try {
        const results = await searchScientific(name, limit)
        if (results.length === 0) return text(`No ITIS taxa match "${name}".`)
        return text(`ITIS results for "${name}":\n\n${results.map((t, i) => formatTaxon(t, i)).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "common_names",
    {
      title: "Common names",
      description: "Common names for a TSN, e.g. lion, puma, cougar.",
      inputSchema: z.object({
        tsn: z.string().describe("Numeric TSN, e.g. '183803' (use search_scientific to find it)"),
        limit: z.number().int().min(1).max(30).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ tsn, limit }) => {
      try {
        const names = await commonNames(tsn, limit)
        if (names.length === 0) return text(`No common names for TSN ${tsn}.`)
        return text(`Common names for TSN ${tsn}:\n\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "hierarchy",
    {
      title: "Taxonomic hierarchy",
      description: "Hierarchy below a TSN: ranks and taxon names.",
      inputSchema: z.object({
        tsn: z.string().describe("Numeric TSN, e.g. '183803'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ tsn }) => {
      try {
        const rows = await hierarchy(tsn)
        if (rows.length === 0) return text(`No hierarchy for TSN ${tsn}.`)
        return text(`Hierarchy for TSN ${tsn}:\n\n${rows.join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "taxon_profile",
    {
      title: "Taxon profile",
      description: "How well documented a taxon is in ITIS: its credibility, global completeness, taxonomic currency and usage ratings, the reason it is unaccepted if there is one, when it was first entered and last updated, and how much evidence is on file as common names, comments, experts, publications, geography and other sources.",
      inputSchema: z.object({ tsn: z.string().describe("Numeric TSN, e.g. '180596'") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement profile locally (paywall removed)
      try { return textError("Not yet implemented: profile") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "lineage_path",
    {
      title: "Lineage path",
      description: "Walk a taxon up to the kingdom one rank at a time using ITIS parent links, printing the rank, name and TSN at every level, which is the other direction from the downward hierarchy tool.",
      inputSchema: z.object({ tsn: z.string().describe("Numeric TSN, e.g. '180596'"), limit: z.number().describe("Maximum ranks to walk, 1-40.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement path locally (paywall removed)
      try { return textError("Not yet implemented: path") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "synonym_report",
    {
      title: "Synonym report",
      description: "Every synonym ITIS holds for a taxon, with the author of each, its own TSN, and the accepted name it redirects to, plus the usage rating that says whether the taxon itself is accepted.",
      inputSchema: z.object({ tsn: z.string().describe("Numeric TSN, e.g. '180596'"), limit: z.number().describe("Synonyms to print, 1-60.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await synonymReport(args))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "taxon_range",
    {
      title: "Taxon range",
      description: "Where ITIS records a taxon: every geographic division and jurisdictional origin on the record, each with its recorded date, plus the parent chain checked for coverage the taxon inherits. taxon_profile only counts these fields, so the list itself is not otherwise reachable.",
      inputSchema: z.object( { tsn: z.string().describe("Numeric TSN, e.g. '180596'."), limit: z.number().describe("Max divisions to print, 1-60.").optional(), ancestors: z.number().describe("Parent levels to check for inherited coverage, 0-3. Default 0, because each level costs another full ITIS record.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement range locally (paywall removed)
    try { return textError("Not yet implemented: range") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ItisError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
