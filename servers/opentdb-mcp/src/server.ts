import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  categoryCounts,
  errorMessage,
  formatQuiz,
  globalCounts,
  listCategories,
  questions,
  sessionToken,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const CATEGORY = z.string().describe("Numeric category id from list_categories, e.g. '17' for Science").optional()
const DIFFICULTY = z.enum(["easy", "medium", "hard"]).describe("Question difficulty").optional()
const TOKEN = z.string().describe("Optional session token from session_token: stops repeats").optional()

export function createServer(): McpServer {
  const server = new McpServer({
    name: "opentdb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "Every trivia category with the numeric id used by the other tools.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const { trivia_categories } = await listCategories()
        const lines = trivia_categories.map((c) => `  ${String(c.id).padStart(3)}  ${c.name}`)
        return text(`${trivia_categories.length} categories:\n\n${lines.join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "category_counts",
    {
      title: "Category question counts",
      description: "How many questions a category holds, split by difficulty. Useful before requesting a quiz.",
      inputSchema: z.object({ category: z.string().describe("Numeric category id, e.g. '17'") }),
      annotations: READ_ONLY,
    },
    async ({ category }) => {
      try {
        const data = await categoryCounts(category)
        const c = data.category_question_count
        return text(
          [
            `Category ${data.category_id}: ${c.total_question_count} questions`,
            `  easy    ${c.total_easy_question_count}`,
            `  medium  ${c.total_medium_question_count}`,
            `  hard    ${c.total_hard_question_count}`,
          ].join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "global_counts",
    {
      title: "Database totals",
      description: "How many questions the whole trivia database holds, overall and per category name.",
      inputSchema: z.object({
        top: z.number().int().min(1).max(50).default(10).describe("Show the N largest categories"),
      }),
      annotations: READ_ONLY,
    },
    async ({ top }) => {
      try {
        const data = await globalCounts()
        const rows = Object.entries(data.categories)
          .map(([name, v]) => ({ name, n: v?.total_num_of_questions ?? 0 }))
          .sort((a, b) => b.n - a.n)
        const o = data.overall
        return text(
          [
            "Open Trivia DB totals",
            "",
            `  verified questions  ${o.total_num_of_verified_questions}`,
            `  pending            ${o.total_num_of_pending_questions}`,
            `  rejected           ${o.total_num_of_rejected_questions}`,
            `  categories         ${rows.length}`,
            "",
            "Largest categories:",
            ...rows.slice(0, top).map((r) => `  ${r.name.padEnd(34)} ${r.n}`),
          ].join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_questions",
    {
      title: "Get raw questions",
      description:
        "Fetch trivia questions with their answers as structured data, for your own formatting.",
      inputSchema: z.object({
        amount: z.number().int().min(1).max(50).default(5).describe("How many questions"),
        category: CATEGORY,
        difficulty: DIFFICULTY,
        token: TOKEN,
      }),
      annotations: READ_ONLY,
    },
    async ({ amount, category, difficulty, token }) => {
      try {
        const list = await questions(amount, category, difficulty, token)
        return text(JSON.stringify(list, null, 2))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "quiz",
    {
      title: "Build a quiz",
      description:
        "A ready-to-read quiz: numbered questions with options and an answer key at the end. Filter by category and difficulty.",
      inputSchema: z.object({
        amount: z.number().int().min(1).max(50).default(5).describe("How many questions"),
        category: CATEGORY,
        difficulty: DIFFICULTY,
        token: TOKEN,
      }),
      annotations: READ_ONLY,
    },
    async ({ amount, category, difficulty, token }) => {
      try {
        const list = await questions(amount, category, difficulty, token)
        const label = [category ? `category ${category}` : "any category", difficulty ?? "any difficulty"].join(", ")
        return text(formatQuiz(list, `Quiz (${label})`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "session_token",
    {
      title: "Session token",
      description:
        "Get or reset a session token. Pass it to quiz or get_questions so the same question is never served twice.",
      inputSchema: z.object({
        action: z.enum(["request", "reset"]).default("request").describe("request a new token, or reset an exhausted one"),
      }),
      annotations: READ_ONLY,
    },
    async ({ action }) => {
      try {
        const token = await sessionToken(action)
        return text(
          `${action === "request" ? "New" : "Reset"} session token:\n\n  ${token}\n\nPass it as the token argument to quiz or get_questions.`
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
