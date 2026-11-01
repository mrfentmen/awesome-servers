import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  formatAbilities,
  formatDocSearch,
  formatDocs,
  formatKind,
  formatKinds,
  formatModule,
  formatModules,
  formatOverview,
  formatQuickstart,
  formatSample,
  formatSampleList,
  formatSampleSearch,
  formatSearchAll,
  formatSection,
  formatSections,
  formatSymbolLookup,
  formatSymbolSearch,
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
  const server = new McpServer({ name: "move-mcp", version: "1.0.0" })

  server.tool(
    "overview",
    "What this server knows about Move: upstream repo and commit, book pages, declaration counts and bundled sources.",
    {},
    async () => {
      try {
        return text(formatOverview())
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("list_docs", "List the Move book pages with their section counts and doc ids.", {}, async () => {
    try {
      return text(formatDocs())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_sections",
    "List section ids and titles, for one book page or for all of them.",
    { doc: z.string().optional().describe("Book page id such as move_functions. Omit to list everything.") },
    async ({ doc }) => {
      try {
        return text(formatSections(doc))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "get_section",
    "Read one documentation section in full, by its section id.",
    { id: z.string().min(1).describe("Section id from list_sections, for example move_abilities#2.") },
    async ({ id }) => {
      try {
        return text(formatSection(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_docs",
    "Search the Move book for a word or phrase. Title matches are ranked first and each hit comes with a snippet.",
    {
      query: z.string().min(1).describe("Text to look for, case-insensitive."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum hits, default 5."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatDocSearch(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "quickstart",
    "Return the Move book introduction: what the language is, modules and scripts, and the first examples.",
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
    "Look up a struct, function, module, constant or use-declaration by exact name (then by prefix across the book).",
    { name: z.string().min(1).describe("Declaration name, for example Option or mint.") },
    async ({ name }) => {
      try {
        return text(formatSymbolLookup(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_symbols",
    "Search declarations by name or signature, optionally restricted to one book page.",
    {
      query: z.string().min(1).describe("Text to look for in the name or signature."),
      module: z.string().optional().describe("Book page id to restrict the search, such as move_standard-library."),
      limit: z.number().int().min(1).max(50).optional().describe("Maximum hits, default 10."),
    },
    async ({ query, module, limit }) => {
      try {
        return text(formatSymbolSearch(query, module, limit ?? 10))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("list_modules", "List every book page with the number of declarations it contains, largest first.", {}, async () => {
    try {
      return text(formatModules())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_symbols_in_module",
    "List every declaration defined on one book page: signature, name and kind.",
    { module: z.string().min(1).describe("Book page id from list_modules.") },
    async ({ module }) => {
      try {
        return text(formatModule(module))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("list_symbol_kinds", "List the declaration kinds in the dataset with their counts (struct, fun, enum, module, const, use, script).", {}, async () => {
    try {
      return text(formatKinds())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_symbols_by_kind",
    "List every declaration of one kind, for example all structs or all functions.",
    { kind: z.string().min(1).describe("Kind from list_symbol_kinds, for example struct.") },
    async ({ kind }) => {
      try {
        return text(formatKind(kind))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool("list_samples", "List the real Move source files bundled from the standard library.", {}, async () => {
    try {
      return text(formatSampleList())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_sample",
    "Return the full source of one bundled Move file.",
    { name: z.string().min(1).describe("File name, with or without the .move extension.") },
    async ({ name }) => {
      try {
        return text(formatSample(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_samples",
    "Search inside the bundled Move sources and return the matching files with a code window.",
    {
      query: z.string().min(1).describe("Text to look for in the source code."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum files, default 5."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSampleSearch(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "search_all",
    "Search documentation, declarations and sample code in one call and report the three groups separately.",
    {
      query: z.string().min(1).describe("Text to look for everywhere."),
      limit: z.number().int().min(1).max(20).optional().describe("Maximum hits per group, default 5."),
    },
    async ({ query, limit }) => {
      try {
        return text(formatSearchAll(query, limit ?? 5))
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  server.tool(
    "list_abilities",
    "Explain the four Move abilities (copy, drop, store, key) by returning the book sections that define and discuss each one.",
    {},
    async () => {
      try {
        return text(formatAbilities())
      } catch (e) {
        return fail(errorMessage(e))
      }
    },
  )

  return server
}
