import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ChempiricalError,
  formatAntoine,
  formatAzeotropes,
  formatIdentify,
  formatMolecule,
  formatParticipants,
  formatReactionList,
  formatResolved,
  formatSearch,
  getMolecule,
  getReaction,
  getStructureSvg,
  identifyStructure,
  listAntoine,
  listAzeotropes,
  listReactions,
  resolveTerms,
  scaleReaction,
  searchMolecules,
  similaritySearch,
  suggestMolecules,
  substructureSearch,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof ChempiricalError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "chempirical-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_molecules",
    "Search 48,000 compounds by name, CAS number, molecular formula or SMILES.",
    {
      q: z.string().min(1).describe("Search term: name, CAS number, formula or SMILES"),
      limit: z.number().int().min(1).max(200).default(20).describe("Results per page (max 200)"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    async ({ q, limit, offset }) => {
      try {
        return text(formatSearch(await searchMolecules(q, limit, offset)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_molecule",
    "Full record for one compound: names, formula, identifiers, molar and exact mass, " +
      "density, melting and boiling points, Antoine constants, azeotropes and structure image.",
    { cas: z.string().min(1).describe("CAS number, e.g. 64-17-5") },
    async ({ cas }) => {
      try {
        return text(formatMolecule(await getMolecule(cas)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "substructure_search",
    "Find every compound containing a structural fragment, matched over the whole catalogue.",
    {
      substructure: z.string().min(1).describe("SMILES or SMARTS fragment, e.g. c1ccc2[nH]ccc2c1"),
      limit: z.number().int().min(1).max(200).default(20),
      offset: z.number().int().min(0).default(0),
    },
    async ({ substructure, limit, offset }) => {
      try {
        return text(formatSearch(await substructureSearch(substructure, limit, offset)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "similarity_search",
    "Find compounds most similar to a structure (Tanimoto similarity, most similar first).",
    {
      smiles: z.string().min(1).describe("Query SMILES"),
      limit: z.number().int().min(1).max(200).default(20),
      offset: z.number().int().min(0).default(0),
    },
    async ({ smiles, limit, offset }) => {
      try {
        return text(formatSearch(await similaritySearch(smiles, limit, offset)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "identify_structure",
    "Identify a compound by SMILES, matched on canonical structure so any spelling of the " +
      "same molecule finds it. Reports whether the match is the same stereoisomer.",
    { smiles: z.string().min(1).describe("SMILES of the structure to identify") },
    async ({ smiles }) => {
      try {
        return text(formatIdentify(await identifyStructure(smiles)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "resolve_terms",
    "Batch resolve up to 200 names, CAS numbers or SMILES to catalogue compounds, including " +
      "physical data and GHS hazards (signal word, H statements).",
    {
      terms: z
        .array(z.string().min(1))
        .min(1)
        .max(200)
        .describe("Names, CAS numbers or SMILES to resolve"),
    },
    async ({ terms }) => {
      try {
        return text(formatResolved(await resolveTerms(terms)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "suggest_molecules",
    "Typeahead for compound pickers: the best eight matches with molar mass, density and boiling point.",
    { q: z.string().min(1).describe("Partial name or formula, e.g. thf") },
    async ({ q }) => {
      try {
        const rows = await suggestMolecules(q)
        if (rows.length === 0) return text("No suggestions.")
        return text(rows.map((m, i) => `${m.name ?? "(unnamed)"}${m.cas ? ` (${m.cas})` : ""} — ${m.molarMass ?? "?"} g/mol`).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_structure_svg",
    "Structure diagram for a compound as SVG markup.",
    {
      cas: z.string().min(1).describe("CAS number"),
      theme: z.enum(["light", "dark"]).optional().describe("Dark theme uses light lines on a dark background"),
    },
    async ({ cas, theme }) => {
      try {
        const svg = await getStructureSvg(cas, theme as "light" | "dark" | undefined)
        if (svg.length <= 6000) return text(svg)
        return text(`SVG for ${cas} is ${svg.length} bytes (${theme ?? "light"} theme); too large to inline.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_reactions",
    "List named reactions, optionally filtered by text, reaction type, source, or readiness for scale calculation.",
    {
      q: z.string().optional().describe("Text filter over reaction name and summary"),
      reaction_type: z.string().optional().describe("Reaction type filter"),
      source: z.string().optional().describe("Source filter"),
      calc_ready: z.boolean().optional().describe("Only reactions with equivalents on file"),
      limit: z.number().int().min(1).max(200).default(20),
      offset: z.number().int().min(0).default(0),
    },
    async ({ q, reaction_type, source, calc_ready, limit, offset }) => {
      try {
        const rows = await listReactions({
          q,
          reactionType: reaction_type,
          source,
          calcReady: calc_ready,
          limit,
          offset,
        })
        return text(formatReactionList(rows))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_reaction",
    "One named reaction with its participants: role, equivalents, molar mass and density.",
    { slug: z.string().min(1).describe("Reaction slug, e.g. henry-nitroaldol") },
    async ({ slug }) => {
      try {
        const r = await getReaction(slug)
        return text(formatParticipants(r.slug, r.participants))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "scale_reaction",
    "Scale a reaction from one reagent and get the mass of every participant.",
    {
      slug: z.string().min(1).describe("Reaction slug"),
      anchor_cas: z.string().min(1).describe("CAS number of the reagent to scale from"),
      anchor_unit: z.enum(["g", "mL", "mmol", "mol"]).describe("Unit of the anchor value"),
      anchor_value: z.number().positive().describe("Amount of the anchor reagent"),
    },
    async ({ slug, anchor_cas, anchor_unit, anchor_value }) => {
      try {
        const rows = await scaleReaction(slug, anchor_cas, anchor_unit, anchor_value)
        return text(formatParticipants(`${slug} scaled from ${anchor_value} ${anchor_unit} of ${anchor_cas}`, rows))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_antoine_constants",
    "Antoine vapour-pressure constants (log10(P/mmHg) = A - B/(C + T/°C)) with valid temperature ranges.",
    {
      limit: z.number().int().min(1).max(200).default(20),
      offset: z.number().int().min(0).default(0),
    },
    async ({ limit, offset }) => {
      try {
        const r = await listAntoine(limit, offset)
        return text(formatAntoine(r.rows, r.total))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_azeotropes",
    "Binary azeotropes with composition, boiling temperature and type.",
    {
      limit: z.number().int().min(1).max(200).default(20),
      offset: z.number().int().min(0).default(0),
    },
    async ({ limit, offset }) => {
      try {
        const r = await listAzeotropes(limit, offset)
        return text(formatAzeotropes(r.rows, r.total))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
