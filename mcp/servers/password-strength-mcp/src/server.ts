import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkPassword, commonListRank, keyboardWalk, variantAudit } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "password-strength-mcp", version: "1.0.0" })
  server.registerTool(
    "check_password",
    {
      title: "Check password",
      description: "Score a password and suggest improvements.",
      inputSchema: z.object( { password: z.string().describe("The password to check.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkPassword(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "common_list_rank",
    {
      title: "Common list rank",
      description: "Look a password up in the real word lists zxcvbn ships (30k passwords, 30k Wikipedia words, surnames, given names, TV and film words) and report where it and its components rank. Local only.",
      inputSchema: z.object( { password: z.string().describe("The candidate password.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await commonListRank(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "keyboard_walk",
    {
      title: "Keyboard walk",
      description: "Read a string as a walk across the qwerty, dvorak, keypad and mac keypad layouts zxcvbn ships graphs for: how much of it lands on a layout, how many direction changes, and the longest straight run. Local only.",
      inputSchema: z.object( { password: z.string().describe("The candidate password.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await keyboardWalk(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "variant_audit",
    {
      title: "Variant audit",
      description: "Score the case, symbol, digit, l33t and reversal mutations an attacker would try first, to show how little a tweak to a password buys. Local only.",
      inputSchema: z.object( { password: z.string().describe("The candidate password.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await variantAudit(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
