import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { generatePassword, passphrase, passwordPatterns } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "password-generator-mcp", version: "1.0.0" })
  server.registerTool(
    "generate_password",
    {
      title: "Generate password",
      description: "Generate a random password with options.",
      inputSchema: z.object( { length: z.number().describe("Length.").optional(), symbols: z.boolean().describe("Include symbols.").optional(), numbers: z.boolean().describe("Include numbers.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await generatePassword(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "passphrase",
    {
      title: "Passphrase",
      description: "Generate a random passphrase of words.",
      inputSchema: z.object( { words: z.number().describe("Number of words.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await passphrase(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "password_entropy",
    {
      title: "Password entropy",
      description: "Measure a password you already have: pool size, nominal and Shannon entropy, repeat penalty, an effective bit count and a crack time at a rate you choose. Pure local maths.",
      inputSchema: z.object( { password: z.string().describe("The password to measure, up to 4096 characters."), guessesPerSecond: z.number().describe("Attack rate for the crack-time estimate, default 1e10.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement entropy locally (paywall removed)
    try { return textError("Not yet implemented: entropy") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "password_patterns",
    {
      title: "Password patterns",
      description: "Find guessable patterns in a password: repeated runs, ascending or descending sequences, QWERTY keyboard walks, years and long lowercase word runs.",
      inputSchema: z.object( { password: z.string().describe("The password to inspect, up to 4096 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await passwordPatterns(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
