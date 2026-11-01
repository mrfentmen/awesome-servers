import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  findSample,
  findSection,
  formatCounts,
  formatDocs,
  formatGlyphHits,
  formatOverview,
  formatQuickstart,
  formatSample,
  formatSampleHits,
  formatSamples,
  formatSearchAll,
  formatSection,
  formatSectionHits,
  formatSectionList,
  formatSymbolList,
  formatSymbolLookup,
  glyphLookup,
  kindCounts,
  lookupSymbol,
  moduleCounts,
  searchSamples,
  searchSections,
  searchSymbols,
  symbolsByKind,
  symbolsInModule,
} from "./data.js"

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] }
}

function fail(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "bqn-mcp", version: "1.0.0" })

  server.tool(
    "overview",
    "What this server knows about BQN: upstream repo and commit, document list, and how many sections, primitives and sample programs are bundled.",
    {},
    async () => {
      try {
        return text(formatOverview())
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_docs",
    "List every bundled BQN document with its id and section count.",
    {},
    async () => {
      try {
        return text(formatDocs())
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_sections",
    "List section ids and titles for one document, or for all documents when `doc` is omitted.",
    {
      doc: z.string().optional().describe("Document id from list_docs, for example bqn_pick or bqn_fold."),
    },
    async ({ doc }) => {
      try {
        return text(formatSectionList(doc))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "get_section",
    "Read one documentation section in full. Use list_sections or search_docs to find its id.",
    {
      id: z.string().min(1).describe("Section id, for example bqn_pick#0."),
    },
    async ({ id }) => {
      try {
        const section = findSection(id)
        if (!section) return fail(`No section with id "${id}". Use list_sections to see valid ids.`)
        return text(formatSection(section))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_docs",
    "Search every BQN doc section for a word or phrase. Title matches rank first and each hit comes with a snippet.",
    {
      query: z.string().min(1).describe("Text to look for, case-insensitive."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum hits. Default 5, max 20."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSectionHits(searchSections(query, limit ?? 5), query))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "quickstart",
    "Return the BQN quick-start material: the index/quick/running sections joined together.",
    {},
    async () => {
      try {
        return text(formatQuickstart())
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "lookup_symbol",
    "Look up a BQN primitive or concept by name (exact match first, then prefix). Returns its title and description.",
    {
      name: z.string().min(1).describe("Primitive or concept name, for example pick, fold, group, undo."),
    },
    async ({ name }) => {
      try {
        return text(formatSymbolLookup(lookupSymbol(name), name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_symbols",
    "Search primitives and concepts by name, title or description.",
    {
      query: z.string().min(1).describe("Text to look for, case-insensitive."),
      module: z.string().optional().describe("Restrict to one module id (see list_modules)."),
      limit: z.number().int().min(1).max(50).optional().describe("Maximum hits. Default 10, max 50."),
    },
    async ({ query, module, limit }) => {
      try {
        return text(formatSymbolList(searchSymbols(query, module, limit ?? 10), `"${query}"`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_modules",
    "List the modules the symbol data is grouped into, with symbol counts, largest first.",
    {},
    async () => {
      try {
        return text(formatCounts(moduleCounts(), "modules"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_symbols_in_module",
    "List every primitive or concept in one module.",
    {
      module: z.string().min(1).describe("Module id from list_modules, for example bqn."),
    },
    async ({ module }) => {
      try {
        return text(formatSymbolList(symbolsInModule(module), `module "${module}"`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_symbol_kinds",
    "List the symbol kinds present in the bundled data with their counts.",
    {},
    async () => {
      try {
        return text(formatCounts(kindCounts(), "symbol kinds"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_symbols_by_kind",
    "List every symbol of a given kind, for example all primitives.",
    {
      kind: z.string().min(1).describe("Kind from list_symbol_kinds, case-insensitive."),
    },
    async ({ kind }) => {
      try {
        return text(formatSymbolList(symbolsByKind(kind), `kind "${kind}"`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_samples",
    "List the real BQN programs bundled from the upstream test suite.",
    {},
    async () => {
      try {
        return text(formatSamples())
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "get_sample",
    "Return the source of one bundled BQN program. The .bqn extension is optional.",
    {
      name: z.string().min(1).describe("Sample name, for example prim.bqn or prim."),
    },
    async ({ name }) => {
      try {
        const sample = findSample(name)
        if (!sample) return fail(`No sample named "${name}". Use list_samples to see the names.`)
        return text(formatSample(sample))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_samples",
    "Search inside the bundled sample programs for a fragment of BQN code.",
    {
      query: z.string().min(1).describe("Text to look for inside the sample sources."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum hits. Default 5, max 20."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSampleHits(searchSamples(query, limit ?? 5), query))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_all",
    "Search docs, primitives and sample code at once. Useful when you do not know which corpus holds the answer.",
    {
      query: z.string().min(1).describe("Text to look for across all three corpora."),
    },
    async ({ query }) => {
      try {
        return text(formatSearchAll(query))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "glyph_lookup",
    "Look up a BQN glyph such as ⊑, +, ∘, ´ or ⊔. Returns every section that uses it plus the matching line — the fastest way to find out what a symbol means.",
    {
      glyph: z.string().min(1).max(4).describe("A BQN glyph, for example ⊑ or ∘."),
      limit: z.number().int().min(1).max(30).optional().describe("Maximum sections. Default 10, max 30."),
    },
    async ({ glyph, limit }) => {
      try {
        return text(formatGlyphHits(glyphLookup(glyph, limit ?? 10), glyph))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  return server
}
