import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { gcdLcm, primeFactors, stats } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "math-tools-mcp", version: "1.0.0" })
  server.registerTool(
    "prime_factors",
    {
      title: "Prime factors",
      description: "Prime factors of a number.",
      inputSchema: z.object( { value: z.number().describe("Integer up to 1e12.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await primeFactors(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gcd_lcm",
    {
      title: "Gcd lcm",
      description: "Greatest common divisor and least common multiple.",
      inputSchema: z.object( { a: z.number().describe("First number."), b: z.number().describe("Second number.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gcdLcm(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "stats",
    {
      title: "Stats",
      description: "Mean, median, mode, and standard deviation of a list.",
      inputSchema: z.object( { values: z.string().describe("Comma separated numbers.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stats(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "sequence_lookup",
    {
      title: "Sequence lookup",
      description: "Identify an integer sequence with the OEIS: sequence number, name, offset, terms, formula and keywords.",
      inputSchema: z.object({ terms: z.string().describe("Comma or space separated terms, or an A-number such as A000045."), limit: z.number().describe("Max sequences, 1-10, default 5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: sequence_lookup ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_math_tools_sequence_lookup", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "evaluate_expression",
    {
      title: "Evaluate expression",
      description: "Evaluate a maths expression or unit conversion on the mathjs service, for example 2^10, det([[1,2],[3,4]]) or 5 km in miles.",
      inputSchema: z.object({ expression: z.string().describe("Expression to evaluate, up to 300 characters."), precision: z.number().int().min(1).max(64).optional().describe("Significant digits, 1-64.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: evaluate_expression ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_math_tools_evaluate_expression", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
