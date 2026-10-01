import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { random, triviaQuestions, wordEntry } from "./api.js"
import { premiumRequired } from "./license.js"

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
    const paywallMessage = await premiumRequired("trivia_questions")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await triviaQuestions(args)) } catch (e) { return textError(error(e)) }
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
    const paywallMessage = await premiumRequired("word_entry")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await wordEntry(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
