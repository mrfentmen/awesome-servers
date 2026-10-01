import { premiumTool } from "./gateway.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search } from "./api.js"
import { validate } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "swift-bic-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search bank SWIFT or BIC codes.",
      inputSchema: z.object( { query: z.string().describe("BIC code, bank name, or country."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "validate",
    {
      title: "Validate",
      description: "Check the format of a BIC code.",
      inputSchema: z.object( { bic: z.string().describe("8 or 11 character BIC.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await validate(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "analyse_bic",
    {
      title: "Analyse a BIC",
      description: "Break a BIC into its four parts - bank code, ISO country, location and branch suffix - and name the country it belongs to.",
      inputSchema: z.object( { bic: z.string().describe("BIC code, 8 or 11 characters.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: analyse_bic ----
    // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_swift_bic_analyse_bic", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "country_directory",
    {
      title: "Country directory",
      description: "Every country the bundled BIC directory covers, with its ISO code and how many BICs it holds.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: country_directory ----
    // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try {
      return text(await premiumTool("mcp_swift_bic_country_directory", args));
    } catch (e) {
      return textError(error(e));
    }
    }
  );

  return server
}
