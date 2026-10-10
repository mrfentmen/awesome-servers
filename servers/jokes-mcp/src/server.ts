import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { dadJoke, searchDadJokes, joke, categories } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'jokes-mcp', version: '1.0.0' })
  server.registerTool(
    'dadJoke',
    {
      title: "Dad Joke",
      description: 'Random dad joke from icanhazdadjoke.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await dadJoke()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'searchDadJokes',
    {
      title: "Search Dad Jokes",
      description: 'Search dad jokes by term.',
      inputSchema: z.object( { query: z.string().describe('Search term.').optional(), limit: z.number().describe('Max results.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchDadJokes(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'joke',
    {
      title: "Joke",
      description: 'Random joke from JokeAPI, optionally by category (Programming, Dark, Pun, etc.).',
      inputSchema: z.object( { category: z.string().describe('Optional category.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await joke(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'categories',
    {
      title: "Categories",
      description: 'List available JokeAPI categories.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await categories()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "two_part_joke",
    {
      title: "Two part joke",
      description: "A setup-and-punchline JokeAPI joke from one named category, e.g. Programming, Pun or Spooky.",
      inputSchema: z.object( { category: z.string().describe("JokeAPI category, e.g. Programming.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: two_part_joke ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jokes_two_part_joke", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "joke_api_info",
    {
      title: "Joke API info",
      description: "The JokeAPI service catalogue: version, how many jokes it holds, and its categories, flags and joke types.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: joke_api_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jokes_joke_api_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
