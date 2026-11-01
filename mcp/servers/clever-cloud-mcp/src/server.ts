import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  CleverError,
  createAppDrain,
  createOrganisation,
  deleteAddonProvider,
  deleteAppDrain,
  deleteOrganisation,
  formatDrains,
  formatEnv,
  formatOrganisation,
  formatOrganisations,
  formatPlans,
  formatProvider,
  formatProviders,
  getAddonProvider,
  getEnvironment,
  getLogs,
  getOrganisation,
  listAddonPlans,
  listAddonProviders,
  listAppDrains,
  listDrains,
  listOrganisations,
  setEnvironment,
  updateAddonProvider,
  updateOrganisation,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof CleverError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "clever-cloud-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_organisations",
    "List every Clever Cloud organisation the credentials can see.",
    {},
    async () => {
      try {
        return text(formatOrganisations(await listOrganisations()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_organisation",
    "Get one organisation by id.",
    { org_id: z.string().describe("Organisation id, e.g. 'orga_xxx'") },
    async ({ org_id }) => {
      try {
        return text(formatOrganisation(await getOrganisation(org_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_organisation",
    "Create a new organisation.",
    {
      name: z.string().describe("Organisation name"),
      description: z.string().optional().describe("Free-text description"),
    },
    async ({ name, description }) => {
      try {
        return text(formatOrganisation(await createOrganisation({ name, description })))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_organisation",
    "Rename an organisation or change its description.",
    {
      org_id: z.string().describe("Organisation id"),
      name: z.string().optional().describe("New name"),
      description: z.string().optional().describe("New description"),
    },
    async ({ org_id, name, description }) => {
      try {
        return text(formatOrganisation(await updateOrganisation(org_id, { name, description })))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_organisation",
    "Delete an organisation. Destructive and cannot be undone.",
    { org_id: z.string().describe("Organisation id") },
    async ({ org_id }) => {
      try {
        await deleteOrganisation(org_id)
        return text(`Deleted organisation ${org_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_addon_providers",
    "List the add-on providers enabled for an organisation (databases, caches, storage...).",
    { org_id: z.string().describe("Organisation id") },
    async ({ org_id }) => {
      try {
        return text(formatProviders(await listAddonProviders(org_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_addon_provider",
    "Get one add-on provider of an organisation.",
    {
      org_id: z.string().describe("Organisation id"),
      provider_id: z.string().describe("Add-on provider id"),
    },
    async ({ org_id, provider_id }) => {
      try {
        return text(formatProvider(await getAddonProvider(org_id, provider_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_addon_provider",
    "Update an add-on provider's settings. Pass the fields to change as a flat object.",
    {
      org_id: z.string().describe("Organisation id"),
      provider_id: z.string().describe("Add-on provider id"),
      fields: z
        .record(z.union([z.string(), z.number(), z.boolean()]))
        .describe("Provider fields to update, e.g. {\"enabled\": true}"),
    },
    async ({ org_id, provider_id, fields }) => {
      try {
        return text(formatProvider(await updateAddonProvider(org_id, provider_id, fields)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_addon_provider",
    "Remove an add-on provider from an organisation. Destructive.",
    {
      org_id: z.string().describe("Organisation id"),
      provider_id: z.string().describe("Add-on provider id"),
    },
    async ({ org_id, provider_id }) => {
      try {
        await deleteAddonProvider(org_id, provider_id)
        return text(`Removed add-on provider ${provider_id} from ${org_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_addon_plans",
    "List the pricing plans available for an add-on provider.",
    {
      org_id: z.string().describe("Organisation id"),
      provider_id: z.string().describe("Add-on provider id"),
    },
    async ({ org_id, provider_id }) => {
      try {
        return text(formatPlans(await listAddonPlans(org_id, provider_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_environment",
    "Read an application's environment variables.",
    { app_id: z.string().describe("Application id, e.g. 'app_xxx'") },
    async ({ app_id }) => {
      try {
        return text(formatEnv(await getEnvironment(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "set_environment",
    "Set environment variables on an application. Values are sent as-is; existing names are overwritten.",
    {
      app_id: z.string().describe("Application id"),
      variables: z.record(z.string()).describe("Name/value pairs, e.g. {\"NODE_ENV\":\"production\"}"),
    },
    async ({ app_id, variables }) => {
      try {
        return text(formatEnv(await setEnvironment(app_id, variables)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_logs",
    "Fetch an application's logs as plain text. Optionally limit to the last N lines.",
    {
      app_id: z.string().describe("Application id"),
      since: z.string().optional().describe("Start timestamp, e.g. 2026-01-01T00:00:00Z"),
      until: z.string().optional().describe("End timestamp"),
      limit: z.number().int().min(1).max(2000).optional().describe("Return only the last N lines"),
    },
    async ({ app_id, since, until, limit }) => {
      try {
        const logs = await getLogs(app_id, { since, until, limit })
        return text(logs.trim() ? logs : "No log output.")
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_drains",
    "List all log drains configured across the account.",
    {},
    async () => {
      try {
        return text(formatDrains(await listDrains()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_app_drains",
    "List the log drains attached to one application.",
    { app_id: z.string().describe("Application id") },
    async ({ app_id }) => {
      try {
        return text(formatDrains(await listAppDrains(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_app_drain",
    "Attach a log drain URL to an application.",
    {
      app_id: z.string().describe("Application id"),
      url: z.string().describe("Drain endpoint, e.g. https://logs.example.com/ingest"),
    },
    async ({ app_id, url }) => {
      try {
        return text(formatDrains(await createAppDrain(app_id, url)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_app_drain",
    "Remove a log drain from an application.",
    {
      app_id: z.string().describe("Application id"),
      id_or_url: z.string().describe("Drain id or its URL"),
    },
    async ({ app_id, id_or_url }) => {
      try {
        await deleteAppDrain(app_id, id_or_url)
        return text(`Removed drain ${id_or_url} from ${app_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
