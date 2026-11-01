import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ApactaError,
  clockOut,
  createActivity,
  createClockingRecord,
  deleteActivity,
  deleteClockingRecord,
  formatActivity,
  formatCity,
  formatClockingRecord,
  formatCompany,
  formatRows,
  getCity,
  getClockingRecord,
  getCompany,
  listActivities,
  listCities,
  listClockingRecords,
  listCompanies,
  updateActivity,
  updateClockingRecord,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

const paging = {
  limit: z.number().int().min(1).max(200).optional().describe("Maximum number of rows to return"),
  offset: z.number().int().min(0).optional().describe("Rows to skip, for paging"),
}

/** Apacta's create/update bodies are model-specific; pass them straight through. */
const bodyShape = {
  body: z
    .record(z.unknown())
    .describe("JSON body forwarded to Apacta unchanged. Field names follow Apacta's API docs."),
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "apacta-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_activities",
    "List activities (the work types time is booked against) for the authenticated Apacta account.",
    paging,
    async ({ limit, offset }) => {
      try {
        const rows = await listActivities(limit, offset)
        return text(formatRows(rows.map((a, i) => formatActivity(a, i)), "No activities returned."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_activity",
    "Create an activity. Pass the activity fields as a JSON body.",
    bodyShape,
    async ({ body }) => {
      try {
        return text(formatActivity(await createActivity(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_activity",
    "Edit an existing activity by id.",
    { activity_id: z.string().describe("Apacta activity id"), ...bodyShape },
    async ({ activity_id, body }) => {
      try {
        return text(formatActivity(await updateActivity(activity_id, body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_activity",
    "Delete an activity by id.",
    { activity_id: z.string().describe("Apacta activity id") },
    async ({ activity_id }) => {
      try {
        await deleteActivity(activity_id)
        return text(`Deleted activity ${activity_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_clocking_records",
    "List clocking records (time entries), newest first as returned by Apacta.",
    paging,
    async ({ limit, offset }) => {
      try {
        const rows = await listClockingRecords(limit, offset)
        return text(formatRows(rows.map((r, i) => formatClockingRecord(r, i)), "No clocking records returned."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_clocking_record",
    "Get one clocking record by id, including start and end time.",
    { clocking_record_id: z.string().describe("Apacta clocking record id") },
    async ({ clocking_record_id }) => {
      try {
        return text(formatClockingRecord(await getClockingRecord(clocking_record_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_clocking_record",
    "Create a clocking record for the authenticated user. Pass the record fields as a JSON body.",
    bodyShape,
    async ({ body }) => {
      try {
        return text(formatClockingRecord(await createClockingRecord(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_clocking_record",
    "Edit an existing clocking record by id.",
    { clocking_record_id: z.string().describe("Apacta clocking record id"), ...bodyShape },
    async ({ clocking_record_id, body }) => {
      try {
        return text(formatClockingRecord(await updateClockingRecord(clocking_record_id, body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_clocking_record",
    "Delete a clocking record by id.",
    { clocking_record_id: z.string().describe("Apacta clocking record id") },
    async ({ clocking_record_id }) => {
      try {
        await deleteClockingRecord(clocking_record_id)
        return text(`Deleted clocking record ${clocking_record_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clock_out",
    "Check out the active clocking record for the authenticated user.",
    {},
    async () => {
      try {
        return text("Checked out.\n" + formatClockingRecord(await clockOut()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_companies",
    "List the companies (legal entities) visible to the authenticated Apacta user.",
    {},
    async () => {
      try {
        const rows = await listCompanies()
        return text(formatRows(rows.map((c, i) => formatCompany(c, i)), "No companies returned."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_company",
    "Get one company by id.",
    { company_id: z.string().describe("Apacta company id") },
    async ({ company_id }) => {
      try {
        return text(formatCompany(await getCompany(company_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_cities",
    "List the cities Apacta supports (used when creating projects and customers).",
    {},
    async () => {
      try {
        const rows = await listCities()
        return text(formatRows(rows.map((c, i) => formatCity(c, i)), "No cities returned."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_city",
    "Get one supported city by id.",
    { city_id: z.string().describe("Apacta city id") },
    async ({ city_id }) => {
      try {
        return text(formatCity(await getCity(city_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof ApactaError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
