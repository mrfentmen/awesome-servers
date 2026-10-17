import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { createWorkbook } from "./local-api.js"
import { readWorkbook, workbookProfile, formulaReport } from "./local-api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "excel-mcp", version: "1.0.0" })
  server.registerTool(
    "create_workbook",
    {
      title: "Create workbook",
      description: "Create an xlsx workbook from rows of comma separated values.",
      inputSchema: z.object( { sheet_name: z.string().describe("Sheet name.").optional(), rows: z.string().describe("Newline separated rows, each comma separated."), filename: z.string().describe("Output file name.").optional() }),
      annotations: WRITE,
    },
    async (args) => {
    try { return text(await createWorkbook(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "read_workbook",
    {
      title: "Read workbook",
      description: "Read the first rows of an xlsx workbook from a path.",
      inputSchema: z.object( { path: z.string().describe("Path to the xlsx file."), max_rows: z.number().describe("Max rows to read.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await readWorkbook(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "workbook_profile",
    {
      title: "Workbook profile",
      description: "Profile a whole sheet column by column: how many cells are filled, blank, distinct, formula or literal, the min, max, mean, median and sum of every numeric column, the date range of every date column and the most frequent text values. The read_workbook tool only prints the first rows, so it can answer none of this.",
      inputSchema: z.object( { path: z.string().describe("Path to the xlsx file."), sheet: z.string().describe("Sheet name. Omit for the first sheet.").optional(), max_rows: z.number().describe("Stop after this many rows. 1 to 20000.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await workbookProfile(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "formula_report",
    {
      title: "Formula report",
      description: "Every formula in a workbook, cell by cell, with the value Excel last cached for it, plus how many formulas cache an error or no result at all. The read_workbook tool stringifies cells so a formula reads as an object and a cached result is never shown.",
      inputSchema: z.object( { path: z.string().describe("Path to the xlsx file."), sheet: z.string().describe("Scan only this sheet. Omit for every sheet.").optional(), max_formulas: z.number().describe("How many formula cells to list, 1 to 200.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await formulaReport(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exchange_rates",
    {
      title: "Exchange rates",
      description: "Current keyless currency rates from Frankfurter, with a caller-selected base and symbols.",
      inputSchema: z.object({ base: z.string().describe("Three-letter base currency.").optional(), symbols: z.string().describe("Comma-separated three-letter symbols.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement rates locally (paywall removed)
    try { return textError("Not yet implemented: rates") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "economic_indicator",
    {
      title: "Economic indicator",
      description: "Recent observations for a World Bank indicator and country code.",
      inputSchema: z.object({ country: z.string().describe("World Bank country code.").optional(), indicator: z.string().describe("World Bank indicator id.").optional(), limit: z.number().describe("Maximum observations.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement indicator locally (paywall removed)
    try { return textError("Not yet implemented: indicator") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
