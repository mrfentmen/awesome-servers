import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { checkHash, checkPassword } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "password-breach-check-mcp", version: "1.0.0" })
  server.registerTool(
    "check_password",
    {
      title: "Check password",
      description: "Check if a password appears in known breaches.",
      inputSchema: z.object( { password: z.string().describe("Password to check.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkPassword(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "check_hash",
    {
      title: "Check hash",
      description: "Check a SHA1 password hash prefix.",
      inputSchema: z.object( { sha1_hash: z.string().describe("Full SHA1 hash of the password.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await checkHash(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "exposure_lookup",
    {
      title: "Exposure lookup",
      description: "Search the public LeakCheck breach corpus for an email address, username or domain. Returns the record count, which field types were exposed and the names of the breach sources - never the leaked values themselves.",
      inputSchema: z.object( { query: z.string().describe("Email address, username or domain."), limit: z.number().int().min(1).max(25).default(10).describe("Max breach sources listed.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement lookup locally (paywall removed)
    try { return textError("Not yet implemented: lookup") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
