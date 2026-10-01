import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { random, triviaCategories } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "riddles-mcp", version: "1.0.0" })
  server.registerTool(
    "random",
    {
      title: "Random",
      description: "A random riddle.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "trivia_questions",
    {
      title: "Trivia questions",
      description: "Trivia questions with answers and distractors from Open Trivia DB, filtered by category, difficulty and question type.",
      inputSchema: z.object({ amount: z.number().describe("How many questions, 1-20, default 5.").optional(), category: z.string().describe("Category name, for example 'science & nature' or 'history'.").optional(), difficulty: z.string().describe("easy, medium or hard.").optional(), type: z.string().describe("multiple or boolean.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: trivia_questions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_riddles_trivia_questions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "word_entry",
    {
      title: "Word entry",
      description: "Wiktionary entry for a word: pronunciation, etymology and meanings, useful for building word puzzles and clues.",
      inputSchema: z.object({ word: z.string().describe("Word to look up, for example 'acrostic'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: word_entry ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_riddles_word_entry", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "rhyme_candidates",
    {
      title: "Rhyme candidates",
      description: "Find rhyming words and reported syllable counts for writing verse riddles.",
      inputSchema: z.object({ word: z.string().max(100).describe("Word to rhyme, default light.").optional(), limit: z.number().int().min(1).max(30).describe("Maximum results, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: rhyme_candidates ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_riddles_rhyme_candidates", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "crossword_matches",
    {
      title: "Crossword matches",
      description: "Find words matching a spelling pattern: ? is one unknown letter and * is any number of letters.",
      inputSchema: z.object({ pattern: z.string().max(100).describe("Spelling pattern, default ??zzle.").optional(), limit: z.number().int().min(1).max(30).describe("Maximum results, default 10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: crossword_matches ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_riddles_crossword_matches", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "trivia_categories",
    {
      title: "Trivia categories",
      description: "Discover the current category names and IDs available from Open Trivia DB.",
      inputSchema: z.object({  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await triviaCategories(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
