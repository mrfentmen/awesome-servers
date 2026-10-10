import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_define, m0_random } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'urban-dictionary-mcp', version: '1.0.0' })
server.registerTool(
    "define",
    {
      title: "Define",
      description: "Get definitions for a term.",
      inputSchema: z.object( { term: z.string().describe("The term to look up."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_define(args)) } catch (e) { return textError(error(e)) }
  }
  )
server.registerTool(
    "random",
    {
      title: "Random",
      description: "Get a random Urban Dictionary entry.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m0_random(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "autocomplete",
    {
      title: "Autocomplete",
      description: "Word completions from Urban Dictionary, which is how you find the term when you only half remember it.",
      inputSchema: z.object( { term: z.string().describe("Start of a word, e.g. ye."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: autocomplete ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_urban_dictionary_autocomplete", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "word_completions",
    {
      title: "Word completions",
      description: "Plain Urban Dictionary word completions in rank order with no preview text, which is the cheaper of the two completion routes.",
      inputSchema: z.object( { term: z.string().describe("Start of a word, e.g. ye."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: word_completions ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_urban_dictionary_word_completions", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
