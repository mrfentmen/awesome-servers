import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { generate, placeholderBlock } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "hipsum-mcp", version: "1.0.0" })
  server.registerTool(
    "generate",
    {
      title: "Generate",
      description: "Generate hipster text.",
      inputSchema: z.object( { sentences: z.number().describe("Sentence count.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "generate_paragraphs",
    {
      title: "Generate paragraphs",
      description: "The paragraph form of the Hipsum API, which the sentence tool never uses: the paras parameter, both documented types (hipster-latin and hipster-centric) and the start-with-lorem flag.",
      inputSchema: z.object({ type: z.string().describe("hipster-latin (default) or hipster-centric.").optional(), paragraphs: z.number().describe("Number of paragraphs, 1-20.").optional(), startWithLorem: z.boolean().describe("Start the first paragraph with the documented phrase.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: generate_paragraphs ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_hipsum_generate_paragraphs", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "lexicon_census",
    {
      title: "Lexicon census",
      description: "The vocabulary behind a Hipsum body: total and distinct word counts, the type-token ratio, mean words per sentence, which words repeat and how often, how much of it is classic Lorem ipsum Latin and which terms, and the longest words used.",
      inputSchema: z.object({ type: z.string().describe("hipster-latin (default) or hipster-centric.").optional(), paragraphs: z.number().describe("Paragraphs to pull and analyse, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: lexicon_census ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_hipsum_lexicon_census", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "placeholder_block",
    {
      title: "Placeholder block",
      description: "A Hipsum body cut to an exact word budget per paragraph, for when placeholder copy has to fit a layout: the requested paragraphs of exactly that many words each, with a note of how much of the pool went unused.",
      inputSchema: z.object({ wordsPerParagraph: z.number().describe("Words per paragraph, 5-300.").optional(), paragraphs: z.number().describe("Paragraphs to produce, 1-10.").optional(), type: z.string().describe("hipster-latin (default) or hipster-centric.").optional(), startWithLorem: z.boolean().describe("Start the first paragraph with the documented phrase.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await placeholderBlock(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
