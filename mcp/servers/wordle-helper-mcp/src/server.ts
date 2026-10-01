import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { filter } from "./api.js"
import { suggest, patternWords, rhymingWords, wordFacts } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wordle-helper-mcp", version: "1.0.0" })
  server.registerTool(
    "suggest",
    {
      title: "Suggest",
      description: "Suggest a starting guess.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await suggest(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "filter",
    {
      title: "Filter",
      description: "Filter candidates given feedback.",
      inputSchema: z.object( { guesses: z.string().describe("JSON array of {word, marks} where marks are g, y, or x per letter.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await filter(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "pattern_words",
    {
      title: "Pattern words",
      description: "Real dictionary words matching a letter pattern, with corpus frequency, where ? matches any single letter. Lets you guess against the real lexicon instead of a bundled list.",
      inputSchema: z.object({ pattern: z.string().describe("Letter pattern using ? for a blank, e.g. 'c?o?e'."), limit: z.number().describe("Max words, 1-50, default 20.").optional(), definition: z.boolean().describe("Include a short definition for each word.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: pattern_words ----
    const paywallMessage = await premiumRequired("pattern_words")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await patternWords(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "rhyming_words",
    {
      title: "Rhyming words",
      description: "Real words that rhyme with a given word, each with its corpus frequency, for building rhymes and finding near misses.",
      inputSchema: z.object({ word: z.string().describe("Word to rhyme, e.g. 'crane'."), limit: z.number().describe("Max words, 1-50, default 20.").optional(), definition: z.boolean().describe("Include a short definition for each word.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: rhyming_words ----
    const paywallMessage = await premiumRequired("rhyming_words")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await rhymingWords(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "word_facts",
    {
      title: "Word facts",
      description: "Wiktionary entry for a word: pronunciation, rhymes, hyphenation, etymology and the range of meanings, so you can tell a rare word from a common one.",
      inputSchema: z.object({ word: z.string().describe("Word to look up, e.g. 'crane'."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: word_facts ----
    const paywallMessage = await premiumRequired("word_facts")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await wordFacts(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
