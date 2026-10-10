import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { m0_categories, m0_getQuestion, m1_formatQuestion, m1_getCategories, m1_getQuestions, m1_TriviaError, booleanQuestion, categoryList } from './api.js'
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'trivia-mcp', version: '1.0.0' })
server.registerTool(
    "get_question",
    {
      title: "Get question",
      description: "Get a random trivia question.",
      inputSchema: z.object( { category: z.string().describe("Category name.").optional(), difficulty: z.string().describe("easy, medium, or hard.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_getQuestion(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "categories",
    {
      title: "Categories",
      description: "List available trivia categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_categories(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "get_categories",
    {
      title: "Get categories",
      description: "List every trivia category with its id.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const cats = await m1_getCategories()
        return text(`Trivia categories:\n${cats.map((c) => `- ${c.id}: ${c.name}`).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
server.registerTool(
    "get_questions",
    {
      title: "Get questions",
      description: "Get trivia questions with answers.",
      inputSchema: z.object(
    {
      amount: z.number().int().min(1).max(50).default(10),
      category: z.number().int().optional().describe("Category id from get_categories"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      type: z.enum(["multiple", "boolean"]).optional().describe("Multiple choice or true/false"),
    }),
      annotations: READ_ONLY,
    },
    async ({ amount, category, difficulty, type }) => {
      try {
        const qs = await m1_getQuestions(amount, category, difficulty, type)
        const filters = [category != null ? `category ${category}` : "", difficulty ?? "", type ?? ""].filter(Boolean).join(", ")
        return text(`Trivia questions${filters ? ` (${filters})` : ""}:\n\n${qs.map((q, i) => m1_formatQuestion(q, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )
  server.registerTool(
    "boolean_question",
    {
      title: "True or false",
      description: "Open Trivia true/false questions, optionally from one raw OpenTDB category id.",
      inputSchema: z.object( { category_id: z.number().describe("OpenTDB category id, 9 to 32.").optional(), amount: z.number().describe("How many questions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: boolean_question ----
    const paywallMessage = await premiumRequired("boolean_question")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await booleanQuestion(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "category_list",
    {
      title: "Category list",
      description: "The OpenTDB category list with the raw numeric ids the API expects, for multiple-choice questions.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    // ---- paywall: category_list ----
    const paywallMessage = await premiumRequired("category_list")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try {
      return text(await categoryList());
    } catch (e) {
      return textError(errorMessage(e));
    }
    }
  );

  return server
}
