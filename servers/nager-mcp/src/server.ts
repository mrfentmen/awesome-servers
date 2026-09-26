import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  countries,
  countryInfo,
  errorMessage,
  formatCountryInfo,
  formatHoliday,
  formatHolidays,
  formatLongWeekends,
  holidays,
  isTodayHoliday,
  longWeekends,
  nextHolidays,
  worldwideHolidays,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const COUNTRY = z.string().describe("Two-letter country code, e.g. 'US', 'DE', 'JP'")
const YEAR = z.string().describe("Four-digit year, e.g. '2026'")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "nager-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_countries",
    {
      title: "List countries",
      description: "Every country the public holiday API covers, with its two-letter code.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const list = await countries()
        const lines = list.map((c) => `  ${c.countryCode}  ${c.name}`)
        return text(`${list.length} countries:\n\n${lines.join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "country_info",
    {
      title: "Country info",
      description: "Official name, region and land borders for a country.",
      inputSchema: z.object({ country: COUNTRY }),
      annotations: READ_ONLY,
    },
    async ({ country }) => {
      try {
        return text(formatCountryInfo(await countryInfo(country)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_holidays",
    {
      title: "Public holidays",
      description: "All public holidays for a country and year, with local and English names.",
      inputSchema: z.object({ year: YEAR, country: COUNTRY }),
      annotations: READ_ONLY,
    },
    async ({ year, country }) => {
      try {
        const list = await holidays(year, country)
        return text(formatHolidays(list, `${country.toUpperCase()} public holidays in ${year}`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "next_holidays",
    {
      title: "Upcoming holidays",
      description: "The next public holidays for a country, starting from today.",
      inputSchema: z.object({ country: COUNTRY }),
      annotations: READ_ONLY,
    },
    async ({ country }) => {
      try {
        const list = await nextHolidays(country)
        return text(formatHolidays(list, `Upcoming holidays in ${country.toUpperCase()}`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "worldwide_holidays",
    {
      title: "Holidays worldwide",
      description:
        "The next public holidays around the world - useful for planning around other countries' closures.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(100).default(25).describe("How many holidays to show"),
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        const list = (await worldwideHolidays()).sort((a, b) => a.date.localeCompare(b.date))
        const shown = list.slice(0, limit)
        const lines = shown.map((h) => `${formatHoliday(h)}  [${h.countryCode}]`)
        return text(`Next holidays worldwide (${shown.length} of ${list.length}):\n\n${lines.join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "long_weekends",
    {
      title: "Long weekends",
      description:
        "Long weekends in a country and year, and whether a bridge day off is needed to get them.",
      inputSchema: z.object({ year: YEAR, country: COUNTRY }),
      annotations: READ_ONLY,
    },
    async ({ year, country }) => {
      try {
        const list = await longWeekends(year, country)
        return text(formatLongWeekends(list, `Long weekends in ${country.toUpperCase()} ${year}`))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "is_today_holiday",
    {
      title: "Is today a holiday",
      description: "Whether today is a public holiday in a country.",
      inputSchema: z.object({ country: COUNTRY }),
      annotations: READ_ONLY,
    },
    async ({ country }) => {
      try {
        const result = await isTodayHoliday(country)
        if (!result.isHoliday) {
          return text(`Today is not a public holiday in ${country.toUpperCase()}.`)
        }
        return text(`Today is a public holiday in ${country.toUpperCase()}:\n\n${formatHoliday(result.holiday).trim()}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
