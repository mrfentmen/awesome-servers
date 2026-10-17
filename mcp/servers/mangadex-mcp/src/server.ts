import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { MangaDexError, formatChapter, formatManga, getChapters, getManga, getTags, searchAuthor, searchManga } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mangadex-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_manga",
    {
      title: "Search manga",
      description: "Search MangaDex for manga by title.",
      inputSchema: z.object(
    {
      title: z.string().describe("Manga title, e.g. 'Berserk' or 'Kaguya-sama'"),
      limit: z.number().int().min(1).max(15).default(8).describe("Max results"),
    }),
      annotations: READ_ONLY,
    },
    async ({ title, limit }) => {
      try {
        const results = await searchManga(title, limit)
        if (results.length === 0) return text(`No manga found for "${title}".`)
        return text(
          `Manga matching "${title}":\n` +
            results.map((m, i) => `${i + 1}. ${formatManga(m)}`).join("\n\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "get_manga",
    {
      title: "Get manga",
      description: "Get full details for a manga by its MangaDex UUID.",
      inputSchema: z.object(
    { id: z.string().describe("Manga UUID from search_manga") }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const m = await getManga(id)
        if (!m) return text(`No manga with id "${id}".`)
        return text(formatManga(m))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_chapters",
    {
      title: "List chapters",
      description: "List chapters of a manga, newest or oldest first.",
      inputSchema: z.object(
    {
      mangaId: z.string().describe("Manga UUID from search_manga"),
      lang: z.string().default("en").describe("Translated language code, e.g. 'en', 'ja', 'es'"),
      limit: z.number().int().min(1).max(50).default(20).describe("Max chapters"),
      oldestFirst: z.boolean().default(true).describe("Sort by chapter number ascending"),
    }),
      annotations: READ_ONLY,
    },
    async ({ mangaId, lang, limit, oldestFirst }) => {
      try {
        const chapters = await getChapters(mangaId, lang, limit, oldestFirst)
        if (chapters.length === 0) {
          return text(`No ${lang} chapters found for that manga.`)
        }
        const head = `Chapters (${lang})${oldestFirst ? " oldest first" : " newest first"}:\n`
        return text(head + chapters.map((c) => `• ${formatChapter(c)}`).join("\n"))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "search_author",
    {
      title: "Search author",
      description: "Search MangaDex for authors/mangaka by name.",
      inputSchema: z.object(
    { name: z.string().describe("Author name, e.g. 'Miura' or 'Oda'") }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        const authors = await searchAuthor(name)
        if (authors.length === 0) return text(`No authors found for "${name}".`)
        return text(
          `Authors matching "${name}":\n` +
            authors
              .map(
                (a, i) =>
                  `${i + 1}. [${a.id}] ${a.name}` +
                  (a.biography ? `\n   ${a.biography.slice(0, 200)}` : "") +
                  (a.twitter ? `\n   Twitter: ${a.twitter}` : "")
              )
              .join("\n")
        )
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "List all MangaDex content tags grouped by category — useful for building search filters.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const tags = await getTags()
        const byGroup = new Map<string, string[]>()
        for (const t of tags) {
          const arr = byGroup.get(t.group) ?? []
          arr.push(t.name)
          byGroup.set(t.group, arr)
        }
        const lines = [...byGroup.entries()].map(
          ([group, names]) => `${group} (${names.length}):\n  ${names.join(", ")}`
        )
        return text(`MangaDex tags:\n\n${lines.join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "manga_statistics",
    {
      title: "Manga statistics",
      description: "MangaDex engagement statistics for one manga UUID: bayesian rating, rating vote spread, follower count, comment thread size and unavailable chapters.",
      inputSchema: z.object({
        id: z.string().describe("MangaDex manga UUID, from search_manga"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement statistics locally (paywall removed)
      try { return textError("Not yet implemented: statistics") } catch (e) { return textError(String(e)) }
    }
  )

  server.registerTool(
    "manga_by_tag",
    {
      title: "Manga by tag",
      description: "The most-followed MangaDex manga carrying a named content tag, e.g. isekai or slice of life, with authors and publication status.",
      inputSchema: z.object({
        tag: z.string().describe("Tag name as listed by list_tags, e.g. \"isekai\""),
        limit: z.number().int().min(1).max(20).default(8),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // TODO: implement tag locally (paywall removed)
      try { return textError("Not yet implemented: tag") } catch (e) { return textError(String(e)) }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MangaDexError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
