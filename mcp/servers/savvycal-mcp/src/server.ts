import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { addBusinessDays, businessDays, convertTime, errorMessage, meetingSlots, teamOverlap, timezoneInfo, worldClock } from "./api.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "savvycal-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "convert_time",
    {
      title: "Convert time between timezones",
      description: "Convert a date and time from one timezone to another, using the live IANA database so daylight saving is handled correctly. No account needed.",
      inputSchema: z.object({
        dateTime: z.string().describe("Local date and time, for example 2026-09-28 14:30."),
        fromTimeZone: z.string().describe("Source IANA timezone, for example America/New_York."),
        toTimeZone: z.string().describe("Target IANA timezone, for example Europe/Berlin."),
      }),
      annotations: READ_ONLY,
    },
    async ({ dateTime, fromTimeZone, toTimeZone }) => {
      try {
        return text(await convertTime({ dateTime, fromTimeZone, toTimeZone }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "timezone_info",
    {
      title: "Timezone and DST info",
      description: "Show a timezone's current offset, its standard and summer offsets, whether it observes daylight saving and the exact dates its clocks change this year.",
      inputSchema: z.object({
        timeZone: z.string().describe("IANA timezone, for example Europe/Berlin."),
        year: z.number().describe("Year to inspect for clock changes. Defaults to the current year.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ timeZone, year }) => {
      try {
        return text(await timezoneInfo({ timeZone, year }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "business_days",
    {
      title: "Count business days",
      description: "Count the working days between two dates, excluding weekends and any holidays you list, with a configurable weekend.",
      inputSchema: z.object({
        startDate: z.string().describe("Start date, for example 2026-09-28."),
        endDate: z.string().describe("End date, for example 2026-10-16."),
        weekendDays: z.array(z.number()).describe("Weekend day numbers, where 0 is Sunday and 6 is Saturday. Defaults to [0, 6].").optional(),
        holidays: z.array(z.string()).describe("Holiday dates to exclude, for example [\"2026-12-25\"].").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ startDate, endDate, weekendDays, holidays }) => {
      try {
        return text(await businessDays({ startDate, endDate, weekendDays, holidays }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "add_business_days",
    {
      title: "Add business days to a date",
      description: "Move a date forward or back by a number of business days, skipping weekends and any holidays you list.",
      inputSchema: z.object({
        startDate: z.string().describe("Starting date, for example 2026-09-28."),
        days: z.number().describe("How many business days to add. Use a negative number to go backwards."),
        weekendDays: z.array(z.number()).describe("Weekend day numbers, where 0 is Sunday and 6 is Saturday. Defaults to [0, 6].").optional(),
        holidays: z.array(z.string()).describe("Holiday dates to skip, for example [\"2026-12-25\"].").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ startDate, days, weekendDays, holidays }) => {
      try {
        return text(await addBusinessDays({ startDate, days, weekendDays, holidays }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "meeting_slots",
    {
      title: "Find free meeting slots",
      description: "Given a date, a timezone, working hours and the times you are already busy, list every free meeting slot of the length you need, optionally shown in other attendees' timezones too.",
      inputSchema: z.object({
        date: z.string().describe("Date to schedule on, for example 2026-09-28."),
        timeZone: z.string().describe("Your IANA timezone, for example America/Chicago."),
        durationMinutes: z.number().describe("Meeting length in minutes. Defaults to 30.").optional(),
        workStartHour: z.number().describe("Working day start hour, 0 to 23. Defaults to 9.").optional(),
        workEndHour: z.number().describe("Working day end hour, 1 to 24. Defaults to 17.").optional(),
        busy: z.array(z.string()).describe("Busy blocks in your timezone, for example [\"2026-09-28 09:00-10:00\"].").optional(),
        alsoShow: z.array(z.string()).describe("Other timezones to show each slot in, for example [\"Europe/London\"].").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ date, timeZone, durationMinutes, workStartHour, workEndHour, busy, alsoShow }) => {
      try {
        return text(await meetingSlots({ date, timeZone, durationMinutes, workStartHour, workEndHour, busy, alsoShow }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "world_clock",
    {
      title: "World clock",
      description: "Show the current local time and UTC offset in up to 12 timezones at once.",
      inputSchema: z.object({
        timeZones: z.array(z.string()).describe("IANA timezones, maximum 12."),
      }),
      annotations: READ_ONLY,
    },
    async ({ timeZones }) => {
      try {
        return text(await worldClock({ timeZones }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "team_overlap",
    {
      title: "Find overlap across timezones",
      description: "Work out which UTC hours fall inside everyone's working hours for a distributed team, listing each attendee's local time for every workable hour.",
      inputSchema: z.object({
        timeZones: z.array(z.string()).describe("Attendee timezones, 2 to 8."),
        windowStartHour: z.number().describe("Each attendee's working day start hour. Defaults to 9.").optional(),
        windowEndHour: z.number().describe("Each attendee's working day end hour. Defaults to 17.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ timeZones, windowStartHour, windowEndHour }) => {
      try {
        return text(await teamOverlap({ timeZones, windowStartHour, windowEndHour }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "calendar_arithmetic",
    {
      title: "Calendar arithmetic",
      description:
        "Move a date by whole months, years or days with the end-of-month clamp made explicit, and report the ISO 8601 week, day of year, quarter and leap-year status of every step.",
      inputSchema: z.object({
        date: z.string().describe("Starting date as YYYY-MM-DD"),
        months: z.number().describe("Months to move by, negative to go back. Applied first.").optional(),
        years: z.number().describe("Years to move by, negative to go back. Applied after months.").optional(),
        days: z.number().describe("Days to move by. Applied last.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement arithmetic locally (paywall removed)
    try { return textError("Not yet implemented: arithmetic") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "duration_report",
    {
      title: "Duration report",
      description:
        "A span of time stated every way a deadline has to be stated: ISO 8601 duration, total seconds, days and hours, whole calendar months and years, and the working-day count against a chosen week.",
      inputSchema: z.object({
        from: z.string().describe("Earlier date as YYYY-MM-DD"),
        to: z.string().describe("Later date as YYYY-MM-DD"),
        workweek: z.array(z.number()).describe("Weekday numbers that count as working, 0=Sunday. Defaults to Mon-Fri.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement report locally (paywall removed)
    try { return textError("Not yet implemented: report") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
