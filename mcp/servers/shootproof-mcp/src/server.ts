import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { errorMessage, getServiceDescription, getMe, listBrands, listBrandEvents, listBrandOrders } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "shootproof-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_service_description",
    {
      title: "Service description",
      description: "ShootProof API entry point with navigation links.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getServiceDescription());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_me",
    {
      title: "Get me",
      description: "Authenticated ShootProof user profile.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMe());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_brands",
    {
      title: "List brands",
      description: "Photography brands on the ShootProof account.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBrands());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_brand_events",
    {
      title: "List brand events",
      description: "Galleries (events) of a brand.",
      inputSchema: z.object({
        brand_id: z.string().describe("ShootProof brand ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ brand_id }) => {
      try {
        return text(await listBrandEvents(brand_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_brand_orders",
    {
      title: "List brand orders",
      description: "Orders of one ShootProof brand, newest first.",
      inputSchema: z.object({
        brand_id: z.string().describe("ShootProof brand ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ brand_id }) => {
      try {
        return text(await listBrandOrders(brand_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "daylight_profile",
    {
      title: "Daylight profile",
      description:
        "The light on one day at one place: sunrise, sunset, solar noon, day length, all three twilight boundaries, and the morning and evening golden and blue hour windows, all in UTC as published.",
      inputSchema: z.object({
        lat: z.number().describe("Latitude, -90 to 90"),
        lon: z.number().describe("Longitude, -180 to 180"),
        date: z.string().describe("Date as YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: daylight_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_shootproof_daylight_profile", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "daylight_comparison",
    {
      title: "Daylight comparison",
      description:
        "The same date at several places, ranked by how much daylight there is, with sunrise, sunset, day length and total golden-hour minutes for each, so a shoot can be moved to wherever the light is best.",
      inputSchema: z.object({
        locations: z.array(z.object({
          name: z.string().describe("Label for the place, e.g. 'Reykjavik'.").optional(),
          lat: z.number().describe("Latitude, -90 to 90"),
          lon: z.number().describe("Longitude, -180 to 180"),
        })).describe("Up to 10 places to compare"),
        date: z.string().describe("Date as YYYY-MM-DD"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: daylight_comparison ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_shootproof_daylight_comparison", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}