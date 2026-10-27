import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  DatamuseError,
  formatHits,
  formatWithDefs,
  meansLike,
  relatedTo,
  rhymesWith,
  spellCheck,
  suggest,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "datamuse-mcp",
    version: "1.0.0",
  })

  server.tool(
    "rhymes_with",
    "Find words that rhyme with a word.",
    { word: z.string().describe("The word to rhyme"), limit: z.number().int().min(1).max(50).default(10) },
    async ({ word, limit }) => {
      try {
        const hits = await rhymesWith(word, limit)
        return text(hits.length ? `Words that rhyme with "${word}":\n${formatHits(hits)}` : `No rhymes for "${word}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "means_like",
    "Find words and phrases with a similar meaning, with definitions.",
    { word: z.string().describe("The meaning to match, e.g. 'retro gaming'"), limit: z.number().int().min(1).max(50).default(10) },
    async ({ word, limit }) => {
      try {
        const hits = await meansLike(word, limit)
        return text(hits.length ? `Words meaning like "${word}":\n${formatWithDefs(hits)}` : `Nothing meaning like "${word}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "related_to",
    "Find words commonly associated with a topic.",
    { word: z.string().describe("The topic, e.g. 'cave'"), limit: z.number().int().min(1).max(50).default(10) },
    async ({ word, limit }) => {
      try {
        const hits = await relatedTo(word, limit)
        return text(hits.length ? `Words related to "${word}":\n${formatHits(hits)}` : `Nothing related to "${word}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "spell_check",
    "Check a word's spelling and get corrections.",
    { word: z.string().describe("The word to check") },
    async ({ word }) => {
      try {
        const hits = await spellCheck(word)
        const correct = hits.some((h) => h.word.toLowerCase() === word.toLowerCase())
        const body = hits.length ? `Closest matches:\n${formatHits(hits)}` : "No close matches."
        return text(correct ? `"${word}" looks correctly spelled. ${body}` : `"${word}" may be misspelled. ${body}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "word_suggestions",
    "Suggest words starting with a prefix.",
    { prefix: z.string().describe("Word start, e.g. 'comp'"), limit: z.number().int().min(1).max(50).default(10) },
    async ({ prefix, limit }) => {
      try {
        const hits = await suggest(prefix, limit)
        return text(hits.length ? `Words starting with "${prefix}":\n${formatHits(hits)}` : `Nothing starts with "${prefix}".`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof DatamuseError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
