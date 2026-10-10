import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, searchSnippets, codeSnippetSearch, snippetProfile } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "publicwww-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_snippets",
    {
      title: "Snippet search",
      description: "URLs of sites containing a code snippet.",
      inputSchema: z.object({
        keywords: z.string().describe("Snippet text, e.g. jquery.")
      }),
      annotations: READ_ONLY,
    },
    async ({ keywords }) => {
      try {
        return text(await searchSnippets(keywords));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "code_snippet_search",
    {
      title: "Search published source code",
      description:
        "Search the open Sourcegraph code index for a literal string and report which repositories use it, where, and on which lines. Searches published source rather than live web pages.",
      inputSchema: z.object({
        snippet: z.string().describe("Literal text to find, e.g. 'export class McpServer' or 'BreweryDB'"),
        limit: z.number().describe("Max matches, 1-25. Defaults to 10.").optional(),
        language: z.string().describe("Restrict to one language, e.g. 'TypeScript' or 'Go'.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: code_snippet_search ----
    const paywallMessage = await premiumRequired("code_snippet_search")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await codeSnippetSearch(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "snippet_profile",
    {
      title: "Profile a snippet",
      description:
        "Profile a snippet before searching for it: Shannon entropy per character, minification and comment ratios, longest line, and a verdict on whether it is worth searching as a literal.",
      inputSchema: z.object({
        snippet: z.string().describe("The snippet to profile, up to 200,000 characters"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: snippet_profile ----
    const paywallMessage = await premiumRequired("snippet_profile")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await snippetProfile(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}