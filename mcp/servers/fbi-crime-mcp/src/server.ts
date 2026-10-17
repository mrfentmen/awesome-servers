import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, arrests, offenses, victims, stateComparison, crimeTrend, crimeSnapshot } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "fbi-crime-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "arrests",
    {
      title: "Arrest data",
      description: "Arrest estimates by state, offense and year.",
      inputSchema: z.object({
        state: z.string().describe("Postal code, e.g. AK.")
      }),
      annotations: READ_ONLY,
    },
    async ({ state }) => {
      try {
        return text(await arrests(state));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "offenses",
    {
      title: "Offense data",
      description: "Offense counts by state and offense type.",
      inputSchema: z.object({
        state: z.string().describe("Postal code, e.g. AK.")
      }),
      annotations: READ_ONLY,
    },
    async ({ state }) => {
      try {
        return text(await offenses(state));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "victims",
    {
      title: "Victim data",
      description: "Victim demographics by state and offense.",
      inputSchema: z.object({
        state: z.string().describe("Postal code, e.g. AK.")
      }),
      annotations: READ_ONLY,
    },
    async ({ state }) => {
      try {
        return text(await victims(state));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "state_comparison",
    {
      title: "Rank states against each other",
      description: "Fetches the all-states aggregate for arrests, offenses or victims in one request and ranks every state, with each state's share of the national total and a bar. The three existing tools each read exactly one state, so nothing here can be compared with anything, and a per-state number on its own does not say whether it is high. Raw counts, not rates: this dataset publishes no population denominator, so read the ranking as total volume and rank, never as relative risk.",
      inputSchema: z.object({
        dataset: z.enum(["arrest", "offense", "victim"]).default("arrest").describe("Which CDE dataset to rank, default arrest"),
        measure: z.string().optional().describe("Specific count field, e.g. violent_crime or property_crime. Omit for the dataset headline."),
        limit: z.number().int().min(1).max(60).default(20).describe("States to show, default 20"),
        states: z.string().optional().describe("Comma-separated states to also pull out, e.g. CA,NY,TX"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await stateComparison(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "crime_trend",
    {
      title: "Multi-year trend for one state",
      description: "Walks the per-year route for one state across a year range and returns a series with year-on-year change and a sparkline, preferring the roll-up row when the response breaks the year down by category. The existing tools return a single aggregate, so a trend, a turning point or one bad year in the middle cannot be seen at all. Raw counts with no population denominator, so direction of volume is readable and crime rate is not.",
      inputSchema: z.object({
        state: z.string().describe("State, full name such as California or abbreviation such as CA."),
        dataset: z.enum(["arrest", "offense", "victim"]).default("arrest").describe("Which CDE dataset, default arrest"),
        start_year: z.number().int().optional().describe("First year, default ten years before end_year."),
        end_year: z.number().int().optional().describe("Last year, default the current year."),
        measure: z.string().optional().describe("Specific count field, e.g. violent_crime. Omit for the headline."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await crimeTrend(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "crime_snapshot",
    {
      title: "Arrests, offenses and victims together",
      description: "Joins all three CDE datasets for one state into a single report, breaking each down by its dimension and by offense with shares. The three existing tools each return one raw JSON dump, and the three views count different things, so this is the only way to read them against each other. States explicitly that the three cannot be summed or averaged, since an offense, an arrest and a victim are three different events.",
      inputSchema: z.object({
        state: z.string().describe("State, full name such as California or abbreviation such as CA."),
        top: z.number().int().min(1).max(30).default(8).describe("Rows per breakdown, default 8"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await crimeSnapshot(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
