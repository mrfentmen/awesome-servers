import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { info } from "./api.js"
import { validate, bbanStructure, batchValidate } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "iban-validator-mcp", version: "1.0.0" })
  server.registerTool(
    "validate",
    {
      title: "Validate",
      description: "Check if an IBAN is valid.",
      inputSchema: z.object( { iban: z.string().describe("The IBAN to check.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await validate(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "info",
    {
      title: "Info",
      description: "Show country and structure for an IBAN.",
      inputSchema: z.object( { iban: z.string().describe("The IBAN to inspect.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await info(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "bban_structure",
    {
      title: "BBAN structure",
      description: "Break an IBAN into its BBAN fields for that country, show the ISO 7064 mod 97 arithmetic, and recompute the national check digits where the country's scheme is tabulated. Pure local maths.",
      inputSchema: z.object( { iban: z.string().describe("The IBAN to break down.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await bbanStructure(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "batch_validate",
    {
      title: "Batch validate",
      description: "Validate a list of up to 200 IBANs at once and summarise them: how many pass, a per-country tally, and for each failure whether the length, the mod 97 check digits or the shape is wrong.",
      inputSchema: z.object( {
        ibans: z.string().describe("IBANs separated by commas, spaces or newlines."),
        limit: z.number().int().min(1).max(200).describe("Max IBANs to check, 1-200, default 50.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await batchValidate(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
