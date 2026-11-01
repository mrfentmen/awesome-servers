import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  findSample,
  findSection,
  formatBaseModules,
  formatDocSearch,
  formatDocs,
  formatKinds,
  formatModuleSymbols,
  formatModules,
  formatOverview,
  formatSample,
  formatSampleList,
  formatSampleSearch,
  formatSearchAll,
  formatSection,
  formatSections,
  formatSymbolLookup,
  formatSymbolSearch,
  formatSymbolsByKind,
  lookupSymbol,
  quickstartSections,
  searchDocs,
  searchSamples,
  searchSymbols,
  sections,
  sectionsOfDoc,
  symbolsOfKind,
  symbolsOfModule,
} from "./data.js"

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "motoko-mcp", version: "1.0.0" })

  server.tool(
    "overview",
    "What this server knows about Motoko: upstream repo and commit, documents, motoko-base symbol count and samples.",
    {},
    async () => {
      try {
        return text(formatOverview())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_docs", "List every bundled Motoko document with its id, title and section count.", {}, async () => {
    try {
      return text(formatDocs())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_sections",
    "List section ids and titles for one document, or for all documents when no doc is given. Use the id with get_section.",
    {
      doc: z.string().optional().describe("Document id or title from list_docs. Omit to list every document."),
    },
    async ({ doc }) => {
      try {
        const list = doc ? sectionsOfDoc(doc) : sections
        if (list.length === 0) return fail(`No document matches "${String(doc)}". Run list_docs for the ids.`)
        return text(formatSections(list))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_section",
    "Return the full text of one doc section by id. Long sections are truncated at 60,000 characters with a marker.",
    { id: z.string().min(1).describe("Section id from list_sections or search_docs, e.g. motoko_index_0#3.") },
    async ({ id }) => {
      try {
        const section = findSection(id)
        if (!section) return fail(`No section with id "${id}". Run search_docs or list_sections first.`)
        return text(formatSection(section))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_docs",
    "Search the Motoko docs. Title matches rank before body matches, and each hit carries a snippet around the match.",
    {
      query: z.string().min(1).describe("Word or phrase to look for, case-insensitive."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum hits. Default 5, max 20."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatDocSearch(query, searchDocs(query, limit ?? 5)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "quickstart",
    "Return the compiler repo's own index page — the fastest way to see how a Motoko program is structured before drilling into a topic.",
    {},
    async () => {
      try {
        const list = quickstartSections()
        if (list.length === 0) return fail("No index page is bundled. Run list_docs.")
        return text(list.map((s) => `## ${s.title}\n\n${s.text}`).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup_symbol",
    "Look up a public Motoko Base symbol by exact name, falling back to prefix matches. Returns every module that exposes it.",
    { name: z.string().min(1).describe("Symbol name such as `map`, `append` or `Array.tabulate`.") },
    async ({ name }) => {
      try {
        return text(formatSymbolLookup(name, lookupSymbol(name)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_symbols",
    "Search public motoko-base symbols by name or signature, optionally restricted to one module.",
    {
      query: z.string().min(1).describe("Substring of the symbol name or signature."),
      module: z.string().optional().describe("Restrict to one module, e.g. Array, Buffer, HashMap."),
      limit: z.number().int().min(1).max(50).optional().describe("Maximum hits. Default 10, max 50."),
    },
    async ({ query, module, limit }) => {
      try {
        return text(formatSymbolSearch(query, searchSymbols(query, module, limit ?? 10)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_modules", "List every motoko-base module bundled here with its public symbol count, largest first.", {}, async () => {
    try {
      return text(formatModules())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_symbols_in_module",
    "List the public symbols of one motoko-base module, with their declaration form.",
    { module: z.string().min(1).describe("Module name, case-insensitive, e.g. Array or TrieMap.") },
    async ({ module }) => {
      try {
        return text(formatModuleSymbols(module, symbolsOfModule(module)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_symbol_kinds",
    "Symbol counts by declaration form (func, let, type, class). motoko-base only exposes public declarations, so this is the useful grouping.",
    {},
    async () => {
      try {
        return text(formatKinds())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_symbols_by_kind",
    "List every symbol with a given declaration form, e.g. `type` for the data types or `class` for the stateful ones.",
    { kind: z.string().min(1).describe("One of: func, let, type, class.") },
    async ({ kind }) => {
      try {
        return text(formatSymbolsByKind(kind, symbolsOfKind(kind)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_samples", "List the real Motoko canister samples bundled with this server: name, path and size.", {}, async () => {
    try {
      return text(formatSampleList())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_sample",
    "Return the full source of one sample Motoko program, with or without the .mo extension.",
    { name: z.string().min(1).describe("Sample name from list_samples.") },
    async ({ name }) => {
      try {
        const sample = findSample(name)
        if (!sample) return fail(`No sample named "${name}". Run list_samples.`)
        return text(formatSample(sample))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_samples",
    "Search inside the bundled sample programs for a substring and show a window around each hit.",
    {
      query: z.string().min(1).describe("Code or text to find inside the samples."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum samples to show. Default 5."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSampleSearch(query, searchSamples(query, limit ?? 5)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_all",
    "One query across all three datasets at once: doc sections, motoko-base symbols and sample code.",
    {
      query: z.string().min(1).describe("Word, symbol or code fragment."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum hits per dataset. Default 5."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSearchAll(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_base_modules",
    "The motoko-base module index at a glance: each module, its symbol count and the first few symbols, so a model can see what Array, Buffer or HashMap offer without paging.",
    {},
    async () => {
      try {
        return text(formatBaseModules())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
