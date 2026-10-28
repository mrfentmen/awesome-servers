import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getAyah, getSurah, listEditions, listSurahs, SourceError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof SourceError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "quran-mcp", version: "1.0.1" })

  server.tool(
    "list_surahs",
    "The 114 chapters with Arabic and English names.",
    {
      // no arguments
    },
    async (a) => {
      try {
        return text(await listSurahs())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_surah",
    "Read one surah in an edition (Arabic or a translation).",
    {
      number: z.number().int().min(1).max(114).describe("Surah number, 1-114"),
      edition: z.string().default("quran-uthmani").describe("Edition id, e.g. quran-uthmani or en.sahih")
    },
    async (a) => {
      try {
        return text(await getSurah(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_ayah",
    "One verse by reference, e.g. 2:255.",
    {
      reference: z.string().describe("Reference like 2:255 or 36:1"),
      edition: z.string().default("en.sahih").describe("Edition id, e.g. quran-uthmani or en.sahih")
    },
    async (a) => {
      try {
        return text(await getAyah(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_editions",
    "Editions available for a language, with format and script.",
    {
      language: z.string().length(2).default("en").describe("Two-letter language code, e.g. en, ar, fr"),
      format: z.enum(["text", "audio"]).default("text").describe("Edition format"),
      limit: z.number().int().min(1).max(50).default(25).describe("Editions to return")
    },
    async (a) => {
      try {
        return text(await listEditions(a))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
