import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { filter, suggest } from "./api.js"
import { premiumTool } from "./gateway.js"
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
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wordle_helper_pattern_words", args)) } catch (e) { return textError(error(e)) }
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
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wordle_helper_rhyming_words", args)) } catch (e) { return textError(error(e)) }
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
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wordle_helper_word_facts", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "related_words",
    {
      title: "Related words",
      description: "Find real dictionary words commonly modified by a given word, with corpus frequency.",
      inputSchema: z.object( { word: z.string().describe("Word to look up."), limit: z.number().optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: related_words ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wordle_helper_related_words", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
