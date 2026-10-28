import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  answersForQuestion,
  hotQuestions,
  questionDetail,
  questionsByTag,
  searchQuestions,
  StackExchangeError,
  userProfile,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof StackExchangeError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const siteArg = z.string().default("stackoverflow").describe('Stack Exchange site, e.g. "stackoverflow", "superuser", "askubuntu"')
const limitArg = z.number().int().min(1).max(25).default(8).describe("How many results to return")

export function createServer(): McpServer {
  const server = new McpServer({ name: "stackexchange-mcp", version: "1.0.0" })

  server.tool(
    "search_questions",
    "Search questions across any Stack Exchange site.",
    {
      query: z.string().min(3).describe('Search terms, e.g. "rust async lifetime"'),
      site: siteArg,
      limit: limitArg,
    },
    async ({ query, site, limit }) => {
      try {
        return text(await searchQuestions(query, site, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "questions_by_tag",
    "Top-voted questions under one tag.",
    {
      tag: z.string().min(1).describe('Tag, e.g. "rust" or "python"'),
      site: siteArg,
      limit: limitArg,
    },
    async ({ tag, site, limit }) => {
      try {
        return text(await questionsByTag(tag, site, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "hot_questions",
    "What is hot on a site right now.",
    { site: siteArg, limit: limitArg },
    async ({ site, limit }) => {
      try {
        return text(await hotQuestions(site, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "question_detail",
    "One question with its full body text, score, tags and link.",
    {
      question_id: z.number().int().min(1).describe("Question id, e.g. 11227809"),
      site: siteArg,
    },
    async ({ question_id, site }) => {
      try {
        return text(await questionDetail(question_id, site))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "answers_for_question",
    "Top answers to a question, highest voted first.",
    {
      question_id: z.number().int().min(1).describe("Question id"),
      site: siteArg,
      limit: z.number().int().min(1).max(25).default(5).describe("How many answers to return"),
    },
    async ({ question_id, site, limit }) => {
      try {
        return text(await answersForQuestion(question_id, site, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "user_profile",
    "Reputation, badges and member-since for one user id.",
    {
      user_id: z.number().int().min(1).describe("User id, e.g. 22656"),
      site: siteArg,
    },
    async ({ user_id, site }) => {
      try {
        return text(await userProfile(user_id, site))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
