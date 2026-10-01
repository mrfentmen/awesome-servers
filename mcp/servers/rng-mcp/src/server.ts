import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { coinFlip, randomNumber, rollDice } from "./local-rng.js"

import { randomWords } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rng-mcp", version: "1.0.0" })
  server.registerTool(
    "roll_dice",
    {
      title: "Roll dice",
      description: "Roll one or more dice.",
      inputSchema: z.object( { count: z.number().describe("How many dice.").optional(), sides: z.number().describe("Sides per die.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await rollDice(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "coin_flip",
    {
      title: "Coin flip",
      description: "Flip a coin.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await coinFlip(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "random_number",
    {
      title: "Random number",
      description: "A random integer in a range.",
      inputSchema: z.object( { min: z.number().describe("Minimum.").optional(), max: z.number().describe("Maximum.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomNumber(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "random_fact",
    {
      title: "Random fact",
      description: "A real random fact from the Useless Facts API, with its source, source URL and permalink.",
      inputSchema: z.object( { language: z.string().max(5).default("en").describe("Fact language code, e.g. 'en' or 'de'.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: random_fact ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rng_random_fact", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "random_advice",
    {
      title: "Random advice",
      description: "A real random advice slip from the Advice Slip API, with its slip id.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: random_advice ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_rng_random_advice", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "random_words",
    {
      title: "Random words",
      description: "A real random batch of English words from the Random Word API, optionally filtered by length.",
      inputSchema: z.object( { count: z.number().int().min(1).max(25).default(5), minLength: z.number().int().min(1).max(30).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await randomWords(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
