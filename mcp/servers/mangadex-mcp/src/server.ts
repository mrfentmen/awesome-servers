import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  MangaDexError,
  formatChapter,
  formatManga,
  getChapters,
  getManga,
  getTags,
  searchAuthor,
  searchManga,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mangadex-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_manga",
    "Search MangaDex for manga by title.",
    {
      title: z.string().describe("Manga title, e.g. 'Berserk' or 'Kaguya-sama'"),
      limit: z.number().int().min(1).max(15).default(8).describe("Max results"),
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
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_manga",
    "Get full details for a manga by its MangaDex UUID.",
    { id: z.string().describe("Manga UUID from search_manga") },
    async ({ id }) => {
      try {
        const m = await getManga(id)
        if (!m) return text(`No manga with id "${id}".`)
        return text(formatManga(m))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_chapters",
    "List chapters of a manga, newest or oldest first.",
    {
      mangaId: z.string().describe("Manga UUID from search_manga"),
      lang: z.string().default("en").describe("Translated language code, e.g. 'en', 'ja', 'es'"),
      limit: z.number().int().min(1).max(50).default(20).describe("Max chapters"),
      oldestFirst: z.boolean().default(true).describe("Sort by chapter number ascending"),
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
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_author",
    "Search MangaDex for authors/mangaka by name.",
    { name: z.string().describe("Author name, e.g. 'Miura' or 'Oda'") },
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
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_tags",
    "List all MangaDex content tags grouped by category — useful for building search filters.",
    {},
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
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MangaDexError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
