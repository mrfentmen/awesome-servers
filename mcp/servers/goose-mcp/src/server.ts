import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  docGroups,
  findSample,
  findSection,
  formatOperatorTable,
  keywords,
  lookupSymbol,
  meta,
  moduleSummaries,
  samples,
  searchSamples,
  searchSections,
  searchSymbols,
  sections,
  sectionsOfDoc,
  symbolsInModule,
  truncate,
  type Section,
  type Symbol,
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

function formatSymbol(s: Symbol): string {
  return `  [${s.module}] ${s.kind} ${s.signature}`
}

function formatSectionHeader(s: Section): string {
  return `# ${s.title}\n_${s.docTitle} · section id: ${s.id}_\n`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "goose-mcp", version: "1.0.0" })

  server.tool(
    "overview",
    "What the bundled Goose dataset contains: upstream repo, source commit, counts of doc sections, stdlib symbols, keywords and samples.",
    {},
    async () => {
      try {
        const docs = docGroups.map((g) => `${g.doc} (${g.count})`).join(", ")
        return text(
          [
            `${meta.language} — memory-safe systems language with a flat data model.`,
            `Repo: ${meta.repo}`,
            `Site: ${meta.site}`,
            `Bundled from commit: ${meta.commit}`,
            "",
            `Doc sections: ${meta.docs} across ${docGroups.length} documents`,
            `Documents: ${docs}`,
            `Stdlib symbols: ${meta.symbols}`,
            `Keywords: ${meta.keywords}`,
            `Sample programs: ${meta.samples}`,
            "",
            "Everything here is extracted from the upstream docs and samples; no network access at runtime.",
          ].join("\n")
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_docs",
    "List every bundled Goose document with its section count and internal doc id.",
    {},
    async () => {
      try {
        const lines = docGroups.map((g) => `  ${g.doc.padEnd(14)} ${String(g.count).padStart(3)} sections  ${g.docTitle}`)
        return text([`${docGroups.length} documents:`, ...lines].join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_sections",
    "List section ids and titles, either for one document or for the whole corpus.",
    {
      doc: z
        .string()
        .optional()
        .describe("Document id or title, e.g. tutorial, reference, stdlib, spec, cpp_rust. Omit for all."),
    },
    async ({ doc }) => {
      try {
        if (doc === undefined || doc.trim() === "") {
          const lines = sections.map((s) => `  ${s.id}  ${s.title}  [${s.doc}]`)
          return text(`${sections.length} sections:\n${lines.join("\n")}`)
        }
        const list = sectionsOfDoc(doc)
        if (list.length === 0) {
          return text(
            `No document matches "${doc}". Known ids: ${docGroups.map((g) => g.doc).join(", ")}.`
          )
        }
        const lines = list.map((s) => `  ${s.id}  ${s.title}`)
        return text(`${list[0].docTitle} — ${list.length} sections:\n${lines.join("\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_section",
    "Read one full doc section by id. This is how you get the authoritative text of a language rule.",
    { id: z.string().describe("Section id from list_sections, e.g. reference#12") },
    async ({ id }) => {
      try {
        const s = findSection(id)
        if (!s) {
          return text(`No section with id "${id}". Use list_sections to find one.`)
        }
        return text(`${formatSectionHeader(s)}\n${truncate(s.text, 60000)}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_docs",
    "Case-insensitive full-text search across every Goose doc. Title matches rank first.",
    {
      query: z.string().describe("Word or phrase, e.g. defer, data stack, guard, thread_fn"),
      limit: z.number().int().min(1).max(20).optional().describe("Max matches (default 5)."),
    },
    async ({ query, limit }) => {
      try {
        const hits = searchSections(query, limit ?? 5)
        if (hits.length === 0) {
          return text(`Nothing in the bundled docs matches "${query}". Try a shorter word.`)
        }
        const body = hits.map(
          (h, i) =>
            `${i + 1}. ${h.section.title}  [${h.section.doc} · ${h.section.id}]\n   ${h.snippet}`
        )
        return text(`${hits.length} match(es) for "${query}":\n\n${body.join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "lookup_symbol",
    "Look up a standard-library symbol by exact name and get its real signatures, grouped by module.",
    { name: z.string().describe("Exact symbol name, e.g. push, length, sqrt, json_parse") },
    async ({ name }) => {
      try {
        const found = lookupSymbol(name)
        if (found.length === 0) {
          return text(`No stdlib symbol named "${name}". Try search_symbols for a partial name.`)
        }
        const byModule = new Map<string, Symbol[]>()
        for (const s of found) {
          const list = byModule.get(s.module) ?? []
          list.push(s)
          byModule.set(s.module, list)
        }
        const blocks = [...byModule.entries()].map(
          ([module, list]) => `[${module}]\n${list.map((s) => `  ${s.kind} ${s.signature}`).join("\n")}`
        )
        return text(`"${name}" — ${found.length} definition(s):\n\n${blocks.join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_symbols",
    "Search stdlib symbol names and signatures, optionally restricted to one module.",
    {
      query: z.string().describe("Substring to find, e.g. sort, utf8, pool"),
      module: z.string().optional().describe("Restrict to a stdlib module, e.g. std, vec, json."),
      limit: z.number().int().min(1).max(50).optional().describe("Max results (default 10)."),
    },
    async ({ query, module, limit }) => {
      try {
        const found = searchSymbols(query, module, limit ?? 10)
        if (found.length === 0) {
          const where = module ? ` in module "${module}"` : ""
          return text(`No stdlib symbol matches "${query}"${where}.`)
        }
        return text(
          `${found.length} symbol(s) matching "${query}":\n${found.map(formatSymbol).join("\n")}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_stdlib_modules",
    "List the standard-library modules with their symbol counts and the kinds of symbol each exposes.",
    {},
    async () => {
      try {
        const mods = moduleSummaries()
        if (mods.length === 0) return text("No stdlib symbols in the bundled data.")
        const lines = mods.map(
          (m) => `  ${m.module.padEnd(12)} ${String(m.count).padStart(4)} symbols  (${m.kinds.join(", ")})`
        )
        return text(`${mods.length} stdlib modules:\n${lines.join("\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_symbols_in_module",
    "List every stdlib symbol in one module, as kind + name + signature.",
    { module: z.string().describe("Module name, e.g. std, vec, math, os, json, regex") },
    async ({ module }) => {
      try {
        const list = symbolsInModule(module)
        if (list.length === 0) {
          return text(
            `No stdlib module "${module}". Modules: ${moduleSummaries().map((m) => m.module).join(", ")}.`
          )
        }
        const lines = list.map((s) => `  ${s.kind} ${s.signature}`)
        return text(`${module} — ${list.length} symbols:\n${lines.join("\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_keywords",
    "List Goose reserved keywords and contextual keywords, optionally filtered by kind.",
    {
      kind: z
        .string()
        .optional()
        .describe("Filter: keyword or contextual. Omit for both."),
    },
    async ({ kind }) => {
      try {
        const wanted = kind?.trim().toLowerCase() ?? ""
        const filtered =
          wanted === "" ? keywords : keywords.filter((k) => k.kind.toLowerCase() === wanted)
        if (filtered.length === 0) {
          return text(`No keywords of kind "${kind}". Kinds present: keyword, contextual.`)
        }
        const groups = new Map<string, string[]>()
        for (const k of filtered) {
          const list = groups.get(k.kind) ?? []
          list.push(k.word)
          groups.set(k.kind, list)
        }
        const blocks = [...groups.entries()].map(
          ([k, words]) => `${k} keywords (${words.length}):\n  ${words.join(", ")}`
        )
        return text(blocks.join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_operator_precedence",
    "The real operator precedence table from the Goose language reference, tightest binding first.",
    {},
    async () => {
      try {
        return text(formatOperatorTable())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_samples",
    "List the bundled sample programs. The numbered ones are the tutorial chapters, in order.",
    {},
    async () => {
      try {
        if (samples.length === 0) return text("No samples in the bundled data.")
        const lines = samples.map(
          (s) => `  ${s.name.padEnd(26)} ${String(Math.round(s.bytes / 1024)).padStart(3)} KB  ${s.path}`
        )
        return text(
          `${samples.length} sample programs (01_tour … 25_serialize are the tutorial chapters):\n${lines.join("\n")}`
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_sample",
    "Return the real source of one bundled sample program, in a code block.",
    { name: z.string().describe("Sample file name, with or without .goose, e.g. 07_sieve") },
    async ({ name }) => {
      try {
        const s = findSample(name)
        if (!s) {
          return text(
            `No sample matches "${name}". Available: ${samples.map((x) => x.name).join(", ")}.`
          )
        }
        return text(`${s.name} (${s.bytes} bytes, ${s.path})\n\n\`\`\`goose\n${s.code}\n\`\`\``)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "find_pattern",
    "Translate a C++/Rust idiom to Goose: searches the 'Goose for C++ and Rust Programmers' doc for RAII, smart pointers, templates, move semantics and similar patterns.",
    {
      query: z.string().describe("Pattern or concept, e.g. RAII, smart pointer, template, move, destructor"),
      limit: z.number().int().min(1).max(10).optional().describe("Max sections (default 3)."),
    },
    async ({ query, limit }) => {
      try {
        const hit = searchSections(query, 50).filter((m) => m.section.doc === "cpp_rust")
        if (hit.length === 0) {
          return text(
            `No C++/Rust pattern section matches "${query}". Try: RAII, smart pointer, template, move, destructor, virtual, macro, namespace.`
          )
        }
        const body = hit
          .slice(0, limit ?? 3)
          .map((m) => `## ${m.section.title}  [${m.section.id}]\n\n${truncate(m.section.text, 12000)}`)
        return text(body.join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_samples",
    "Search inside the bundled sample programs' source code and return a window around each hit.",
    {
      query: z.string().describe("Code substring, e.g. defer, thread_fn, json_parse, match"),
      limit: z.number().int().min(1).max(20).optional().describe("Max samples (default 5)."),
    },
    async ({ query, limit }) => {
      try {
        const hits = searchSamples(query, limit ?? 5)
        if (hits.length === 0) {
          return text(`No sample source contains "${query}".`)
        }
        const body = hits.map((h) => `${h.sample.name} (${h.sample.path})\n  ${h.snippet}`)
        return text(`${hits.length} sample(s) containing "${query}":\n\n${body.join("\n\n")}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
