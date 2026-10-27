import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  HolidayError,
  countryInfo,
  holidayOnDate,
  holidaysForYear,
  isToday,
  listCountries,
  longWeekends,
  upcoming,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof HolidayError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "public-holidays-mcp", version: "1.0.0" })

  const country = z.string().length(2).describe("Two-letter country code, e.g. US, DE, JP")
  const year = z.number().int().min(1970).max(2100).describe("Four-digit year")

  server.tool("list_countries", "Every country Nager.Date has holiday data for.", {}, async () => {
    try {
      return text(await listCountries())
    } catch (e) {
      return text(errorMessage(e))
    }
  })

  server.tool(
    "upcoming_holidays",
    "The next public holidays in a country, with day counts.",
    { country },
    async ({ country: c }) => {
      try {
        return text(await upcoming(c))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "holidays_by_year",
    "Every public holiday in a country for one year.",
    { country, year },
    async ({ country: c, year: y }) => {
      try {
        return text(await holidaysForYear(c, y))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "is_today_holiday",
    "Whether today is a public holiday in a country, and which one.",
    { country },
    async ({ country: c }) => {
      try {
        return text(await isToday(c))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "holiday_on_date",
    "Whether one exact date is a public holiday in a country.",
    { country, date: z.string().describe("Date as YYYY-MM-DD") },
    async ({ country: c, date }) => {
      try {
        return text(await holidayOnDate(c, date))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "long_weekends",
    "Long weekends in a country for a year, with bridge days.",
    { country, year },
    async ({ country: c, year: y }) => {
      try {
        return text(await longWeekends(c, y))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "country_info",
    "Country name, official name, region and bordering countries.",
    { country },
    async ({ country: c }) => {
      try {
        return text(await countryInfo(c))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
