import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { formula } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "homebrew-mcp", version: "1.0.0" })
  server.registerTool(
    "formula",
    {
      title: "Formula",
      description: "Details for one Homebrew formula.",
      inputSchema: z.object( { name: z.string().describe("Formula name like git.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await formula(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "cask",
    {
      title: "Cask",
      description: "Details for one Homebrew cask: version, apps and binaries it installs, macOS requirement, conflicts and caveats.",
      inputSchema: z.object({ name: z.string().describe("Cask token like firefox or visual-studio-code.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: cask ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_homebrew_cask", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "formula_bottles",
    {
      title: "Formula bottles",
      description: "Which prebuilt Homebrew bottles exist for a formula (per platform, with sha256 and cellar path), plus its build and test dependencies.",
      inputSchema: z.object({ name: z.string().describe("Formula name like git.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: formula_bottles ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_homebrew_formula_bottles", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
