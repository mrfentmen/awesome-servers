import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkText, formatResult, LanguageToolError, listLanguages, translateText, wordLookup } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "languagetool-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "check_text",
    {
      title: "Check grammar",
      description: "Check grammar, spelling and style in 30+ languages. Returns issues with fix suggestions.",
      inputSchema: z.object({
        text: z.string().max(20000).describe("Text to check (max 20000 chars)"),
        language: z.string().default("auto").describe("Language code like 'en-US', 'de', 'fr', or 'auto'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ text: input, language }) => {
      try {
        return text(formatResult(await checkText(input, language)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_languages",
    {
      title: "List languages",
      description: "Supported LanguageTool language codes.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const langs = await listLanguages()
        return text(langs.map((l) => `${l.code} — ${l.name}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "translate_text",
    {
      title: "Translate text",
      description: "Translate up to 500 characters between two languages with the MyMemory public API, including match quality.",
      inputSchema: z.object({
        text: z.string().max(500).describe("Text to translate (max 500 chars)"),
        from: z.string().default("en").describe("Source language code, e.g. 'en'"),
        to: z.string().describe("Target language code, e.g. 'de'"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: translate_text ----
      const paywallMessage = await premiumRequired("translate_text")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await translateText(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "word_lookup",
    {
      title: "Word lookup",
      description: "Look up a word with Datamuse: spelling variants, matching words, rhymes or definitions.",
      inputSchema: z.object({
        word: z.string().min(1).max(80).describe("Word to look up"),
        relation: z.enum(["spelling", "match", "rhyme", "define"]).describe("What to look for"),
        limit: z.number().int().min(1).max(25).default(8).describe("Max results"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: word_lookup ----
      const paywallMessage = await premiumRequired("word_lookup")
      if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
      // ---- paywall: end ----
      try {
        return text(await wordLookup(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LanguageToolError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
