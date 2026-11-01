import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  findSample,
  findSection,
  formatBuiltins,
  formatDocs,
  formatKinds,
  formatModules,
  formatOverview,
  formatSample,
  formatSampleHits,
  formatSampleList,
  formatSearchAll,
  formatSection,
  formatSectionHits,
  formatSectionsList,
  formatSymbols,
  lookupSymbols,
  searchSamples,
  searchSections,
  searchSymbols,
  sectionsOfDoc,
  symbolsByKind,
  symbolsInModule,
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

const limitArg = (fallback: number, max: number) =>
  z
    .number()
    .int()
    .min(1)
    .max(max)
    .optional()
    .describe(`Maximum number of results. Default ${fallback}, max ${max}.`)

export function createServer(): McpServer {
  const server = new McpServer({ name: "vyper-mcp", version: "1.0.0" })

  server.tool(
    "overview",
    "What this server knows about Vyper: source repo, docs site, the upstream commit the data came from, and how many sections, symbols and examples are bundled.",
    {},
    async () => {
      try {
        return text(formatOverview())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_docs",
    "List every documentation page with its section count and the id to pass to list_sections.",
    {},
    async () => {
      try {
        return text(formatDocs())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_sections",
    "List the section titles and section ids of one documentation page, or of every page when no doc is given.",
    {
      doc: z.string().optional().describe("Page id from list_docs, e.g. vyper_built-in-functions. Omit for all pages."),
    },
    async ({ doc }) => {
      try {
        return text(formatSectionsList(doc))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_section",
    "Return the full text of one documentation section by its id. Long sections are truncated at 60000 characters with an explicit marker.",
    { id: z.string().min(1).describe("Section id from list_sections, e.g. vyper_built-in-functions#5.") },
    async ({ id }) => {
      try {
        const section = findSection(id)
        if (!section) return fail(`No section with id "${id}". Use list_sections to find valid ids.`)
        return text(formatSection(section))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_docs",
    "Search the whole Vyper documentation. Title matches rank before body matches, and each hit comes with a window around the match.",
    {
      query: z.string().min(1).describe("Text to look for, case-insensitive."),
      limit: limitArg(5, 20),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSectionHits(searchSections(query, limit ?? 5)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "quickstart",
    "Return the complete Vyper quickstart page: install, compile and deploy a first contract.",
    {},
    async () => {
      try {
        const page = sectionsOfDoc("vyper_quickstart")
        const fallback = page.length > 0 ? page : sectionsOfDoc("quickstart")
        if (fallback.length === 0) return fail("The quickstart page is not in this dataset. Try search_docs for \"compile\".")
        return text(fallback.map(formatSection).join("\n\n---\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup_symbol",
    "Look up a Vyper builtin function, class or compiler attribute by exact name, falling back to prefix matches. Returns every overload signature.",
    { name: z.string().min(1).describe("Symbol name, e.g. len, raw_call, keccak256, convert, cancun.") },
    async ({ name }) => {
      try {
        return text(formatSymbols(lookupSymbols(name), `Symbols named "${name}"`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_symbols",
    "Search symbol names and signatures, optionally limited to one documentation page.",
    {
      query: z.string().min(1).describe("Text to match against the symbol name or signature."),
      module: z.string().optional().describe("Restrict to one page id, e.g. built-in-functions."),
      limit: limitArg(10, 50),
    },
    async ({ query, module, limit }) => {
      try {
        return text(formatSymbols(searchSymbols(query, module, limit ?? 10), `Symbols matching "${query}"`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_modules",
    "Every documentation page that contributed symbols, with how many and which kinds.",
    {},
    async () => {
      try {
        return text(formatModules())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_symbols_in_module",
    "List every symbol extracted from one documentation page, with its signature and kind.",
    { module: z.string().min(1).describe("Page id from list_modules, e.g. built-in-functions.") },
    async ({ module }) => {
      try {
        const items = symbolsInModule(module)
        if (items.length === 0) return fail(`No symbols under module "${module}". Use list_modules to see valid ids.`)
        return text(formatSymbols(items, `Symbols in ${module}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_symbol_kinds",
    "The kinds of symbol in the dataset (function, class, method, attribute, data) with their counts.",
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
    "List every symbol of one kind, such as all functions or all compiler attributes.",
    { kind: z.string().min(1).describe("Kind from list_symbol_kinds, e.g. function or attribute.") },
    async ({ kind }) => {
      try {
        const items = symbolsByKind(kind)
        if (items.length === 0) return fail(`No symbols of kind "${kind}". Use list_symbol_kinds to see the kinds.`)
        return text(formatSymbols(items, `Symbols of kind ${kind}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_builtin_functions",
    "The full built-in reference: every builtin function, modifier and decorator extracted from the built-in functions page, grouped by kind, with signatures.",
    {},
    async () => {
      try {
        return text(formatBuiltins())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_samples",
    "List the real example contracts bundled with this server, with path and size.",
    {},
    async () => {
      try {
        return text(formatSampleList())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_sample",
    "Return the source of one bundled example contract. Accepts the name with or without the .vy extension.",
    { name: z.string().min(1).describe("Example name, e.g. wallet or wallet.vy.") },
    async ({ name }) => {
      try {
        const sample = findSample(name)
        if (!sample) return fail(`No example named "${name}". Use list_samples to see the bundled contracts.`)
        return text(formatSample(sample))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_samples",
    "Search inside the bundled example contracts and return a window around each hit.",
    {
      query: z.string().min(1).describe("Text to look for in the example source."),
      limit: limitArg(5, 20),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSampleHits(searchSamples(query, limit ?? 5)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_all",
    "One query across documentation, symbols and example contracts, returned as three labelled sections.",
    {
      query: z.string().min(1).describe("Text to look for everywhere."),
      limit: limitArg(5, 20),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSearchAll(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
