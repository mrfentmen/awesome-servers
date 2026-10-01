import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listPages,
  getPage,
  listIncidents,
  incidentDetails,
  incidentUpdates,
  components,
  componentDetails,
  subscribers,
  upcomingMaintenance,
  maintenanceDetails,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "statuspage-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_pages",
    {
      title: "List pages",
      description: "Status pages the key can read, with id and name.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listPages());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "One status page by id, with components and status.",
      inputSchema: z.object({
        page_id: z.string().describe("Statuspage page ID, e.g. 1a2b3c4d5e6f")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await getPage(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_incidents",
    {
      title: "List incidents",
      description: "Recent incidents on a page, newest first.",
      inputSchema: z.object({
        page_id: z.string().describe("Statuspage page ID, e.g. 1a2b3c4d5e6f")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await listIncidents(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "incident_details",
    {
      title: "Incident details",
      description: "Single incident.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID."),
        incident_id: z.string().describe("Incident ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id, incident_id }) => {
      try {
        return text(await incidentDetails(page_id, incident_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "incident_updates",
    {
      title: "Incident updates",
      description: "Update timeline.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID."),
        incident_id: z.string().describe("Incident ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id, incident_id }) => {
      try {
        return text(await incidentUpdates(page_id, incident_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "components",
    {
      title: "Components",
      description: "Status components.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await components(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "component_details",
    {
      title: "Component details",
      description: "Single component.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID."),
        component_id: z.string().describe("Component ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id, component_id }) => {
      try {
        return text(await componentDetails(page_id, component_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "subscribers",
    {
      title: "Subscribers",
      description: "Page subscribers.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await subscribers(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "upcoming_maintenance",
    {
      title: "Upcoming maintenance",
      description: "Scheduled windows.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id }) => {
      try {
        return text(await upcomingMaintenance(page_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "maintenance_details",
    {
      title: "Maintenance details",
      description: "Single window.",
      inputSchema: z.object({
        page_id: z.string().describe("Page ID."),
        maintenance_id: z.string().describe("Maintenance ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ page_id, maintenance_id }) => {
      try {
        return text(await maintenanceDetails(page_id, maintenance_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}