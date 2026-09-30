import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { CodewarsError, formatKata, formatUser, getKata, getUser, completedKata, supportedLanguages } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "codewars-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_user",
    {
      title: "Get user",
      description: "A Codewars user: honor, rank, clan, languages, completed kata.",
      inputSchema: z.object({
        username: z.string().describe("Codewars username"),
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(formatUser(await getUser(username)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_kata",
    {
      title: "Get kata",
      description: "One kata by id or slug: name, rank, tags.",
      inputSchema: z.object({
        id_or_slug: z.string().describe("Kata id or slug, e.g. 'valid-parentheses'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id_or_slug }) => {
      try {
        return text(formatKata(await getKata(id_or_slug)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "completed_kata",
    {
      title: "Completed kata",
      description: "The kata a Codewars user has completed, most recent first, with the language and date for each and the total count.",
      inputSchema: z.object({
        username: z.string().describe("Codewars username"),
        page: z.number().describe("Which page of 200 to read, 1-50").optional(),
        limit: z.number().describe("Max kata to list, 1-50").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await completedKata(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "language_progress",
    {
      title: "Language progress",
      description: "Which languages a Codewars user's recent completed kata are written in, ranked by how many, with the most recent date in each.",
      inputSchema: z.object({
        username: z.string().describe("Codewars username"),
        limit: z.number().describe("Max languages to list, 1-30").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: language_progress ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_codewars_language_progress", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "completion_timeline",
    {
      title: "Completion timeline",
      description: "How many kata a Codewars user completed in each year, taken from their most recent completions.",
      inputSchema: z.object({
        username: z.string().describe("Codewars username"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: completion_timeline ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_codewars_completion_timeline", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "supported_languages",
    {
      title: "Supported languages",
      description: "The languages Codewars supports, optionally filtered by name, with the id the API uses for each.",
      inputSchema: z.object({
        filter: z.string().describe("Substring to match against language name or id").optional(),
        limit: z.number().describe("Max languages to list, 1-58").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await supportedLanguages(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof CodewarsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
