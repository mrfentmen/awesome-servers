import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import * as api from "./api.js"

const jsonBody = z
  .record(z.unknown())
  .describe("Svix JSON request body, passed through unchanged")

const appId = z.string().min(1).describe("Svix application id (app_...)")
const endpointId = z.string().min(1).describe("Svix endpoint id (ep_...)")
const msgId = z.string().min(1).describe("Svix message id (msg_...)")
const attemptId = z.string().min(1).describe("Svix delivery attempt id (atmpt_...)")
const integId = z.string().min(1).describe("Svix integration id (integ_...)")

const limit = z
  .number()
  .int()
  .min(1)
  .max(250)
  .optional()
  .describe("Page size, 1-250 (Svix default is 50)")
const iterator = z
  .string()
  .optional()
  .describe("Pagination cursor copied from a previous response's iterator")

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function run(work: () => Promise<string>) {
  try {
    return text(await work())
  } catch (error) {
    return fail(errorMessage(error))
  }
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "svix-mcp", version: "1.0.0" })

  server.tool(
    "list_applications",
    "List Svix applications in the current environment. Use the returned iterator to page further.",
    { limit, iterator },
    async ({ limit: pageSize, iterator: cursor }) =>
      run(async () => api.formatPage(await api.listApplications(pageSize, cursor), api.formatApplication, "applications")),
  )

  server.tool(
    "create_application",
    "Create a Svix application. Body usually contains name and optionally uid, rateLimit and metadata.",
    { body: jsonBody },
    async ({ body }) =>
      run(async () => `Created application.\n${api.formatApplication(await api.createApplication(body))}`),
  )

  server.tool(
    "get_application",
    "Fetch a single Svix application by id.",
    { app_id: appId },
    async ({ app_id }) => run(async () => api.formatApplication(await api.getApplication(app_id))),
  )

  server.tool(
    "update_application",
    "Update a Svix application. Send the full application body, including the name you want to keep.",
    { app_id: appId, body: jsonBody },
    async ({ app_id, body }) =>
      run(async () => `Updated application.\n${api.formatApplication(await api.updateApplication(app_id, body))}`),
  )

  server.tool(
    "delete_application",
    "Permanently delete a Svix application and every endpoint and message it owns. This cannot be undone.",
    { app_id: appId },
    async ({ app_id }) =>
      run(async () => {
        await api.deleteApplication(app_id)
        return `Deleted application ${app_id}.`
      }),
  )

  server.tool(
    "list_endpoints",
    "List the webhook endpoints registered on a Svix application.",
    { app_id: appId, limit, iterator },
    async ({ app_id, limit: pageSize, iterator: cursor }) =>
      run(async () =>
        api.formatPage(await api.listEndpoints(app_id, pageSize, cursor), api.formatEndpoint, "endpoints"),
      ),
  )

  server.tool(
    "create_endpoint",
    "Create a webhook endpoint on a Svix application. Body requires url and optionally description, filterTypes, channels, rateLimit and disabled.",
    { app_id: appId, body: jsonBody },
    async ({ app_id, body }) =>
      run(async () => `Created endpoint.\n${api.formatEndpoint(await api.createEndpoint(app_id, body))}`),
  )

  server.tool(
    "get_endpoint",
    "Fetch a single webhook endpoint by id.",
    { app_id: appId, endpoint_id: endpointId },
    async ({ app_id, endpoint_id }) =>
      run(async () => api.formatEndpoint(await api.getEndpoint(app_id, endpoint_id))),
  )

  server.tool(
    "update_endpoint",
    "Update a webhook endpoint. Send the full endpoint body, including the url you want to keep.",
    { app_id: appId, endpoint_id: endpointId, body: jsonBody },
    async ({ app_id, endpoint_id, body }) =>
      run(async () =>
        `Updated endpoint.\n${api.formatEndpoint(await api.updateEndpoint(app_id, endpoint_id, body))}`,
      ),
  )

  server.tool(
    "delete_endpoint",
    "Delete a webhook endpoint. Messages already delivered stay in the log, but no further deliveries are attempted.",
    { app_id: appId, endpoint_id: endpointId },
    async ({ app_id, endpoint_id }) =>
      run(async () => {
        await api.deleteEndpoint(app_id, endpoint_id)
        return `Deleted endpoint ${endpoint_id}.`
      }),
  )

  server.tool(
    "get_endpoint_secret",
    "Read an endpoint's webhook signing secret, which is used to verify Svix signatures.",
    { app_id: appId, endpoint_id: endpointId },
    async ({ app_id, endpoint_id }) =>
      run(async () => api.formatSecret(await api.getEndpointSecret(app_id, endpoint_id))),
  )

  server.tool(
    "rotate_endpoint_secret",
    "Rotate an endpoint's signing secret. Optionally pass { key } to set your own secret instead of a generated one.",
    { app_id: appId, endpoint_id: endpointId, body: jsonBody.optional() },
    async ({ app_id, endpoint_id, body }) =>
      run(async () =>
        `Rotated.\n${api.formatSecret(await api.rotateEndpointSecret(app_id, endpoint_id, body ?? {}))}`,
      ),
  )

  server.tool(
    "get_endpoint_stats",
    "Get delivery counts (success, pending, fail) for an endpoint, optionally within a time window.",
    {
      app_id: appId,
      endpoint_id: endpointId,
      since: z.string().optional().describe("ISO 8601 start of the window"),
      until: z.string().optional().describe("ISO 8601 end of the window"),
    },
    async ({ app_id, endpoint_id, since, until }) =>
      run(async () => api.formatStats(await api.getEndpointStats(app_id, endpoint_id, since, until))),
  )

  server.tool(
    "list_messages",
    "List messages sent through a Svix application.",
    { app_id: appId, limit, iterator },
    async ({ app_id, limit: pageSize, iterator: cursor }) =>
      run(async () =>
        api.formatPage(await api.listMessages(app_id, pageSize, cursor), api.formatMessage, "messages"),
      ),
  )

  server.tool(
    "create_message",
    "Send a message to the endpoints of an application. Body requires eventType and payload; eventId, channels and tags are optional.",
    { app_id: appId, body: jsonBody },
    async ({ app_id, body }) =>
      run(async () => `Sent message.\n${api.formatMessage(await api.createMessage(app_id, body))}`),
  )

  server.tool(
    "get_message",
    "Fetch a single message, including its payload, by id.",
    { app_id: appId, msg_id: msgId },
    async ({ app_id, msg_id }) => run(async () => api.formatMessage(await api.getMessage(app_id, msg_id))),
  )

  server.tool(
    "list_message_attempts",
    "List the delivery attempts made for one message, newest first.",
    { app_id: appId, msg_id: msgId, limit, iterator },
    async ({ app_id, msg_id, limit: pageSize, iterator: cursor }) =>
      run(async () =>
        api.formatPage(
          await api.listMessageAttempts(app_id, msg_id, pageSize, cursor),
          api.formatAttempt,
          "attempts",
        ),
      ),
  )

  server.tool(
    "get_attempt",
    "Fetch one delivery attempt, including the response body returned by the receiver.",
    { app_id: appId, msg_id: msgId, attempt_id: attemptId },
    async ({ app_id, msg_id, attempt_id }) =>
      run(async () => api.formatAttempt(await api.getAttempt(app_id, msg_id, attempt_id))),
  )

  server.tool(
    "list_endpoint_attempts",
    "List delivery attempts made to one endpoint across all messages.",
    { app_id: appId, endpoint_id: endpointId, limit, iterator },
    async ({ app_id, endpoint_id, limit: pageSize, iterator: cursor }) =>
      run(async () =>
        api.formatPage(
          await api.listEndpointAttempts(app_id, endpoint_id, pageSize, cursor),
          api.formatAttempt,
          "attempts",
        ),
      ),
  )

  server.tool(
    "list_integrations",
    "List the integrations (Slack, Discord and similar) configured on an application.",
    { app_id: appId, limit, iterator },
    async ({ app_id, limit: pageSize, iterator: cursor }) =>
      run(async () =>
        api.formatPage(await api.listIntegrations(app_id, pageSize, cursor), api.formatIntegration, "integrations"),
      ),
  )

  server.tool(
    "create_integration",
    "Create an integration on an application. Body requires name.",
    { app_id: appId, body: jsonBody },
    async ({ app_id, body }) =>
      run(async () => `Created integration.\n${api.formatIntegration(await api.createIntegration(app_id, body))}`),
  )

  server.tool(
    "get_integration",
    "Fetch a single integration by id.",
    { app_id: appId, integ_id: integId },
    async ({ app_id, integ_id }) =>
      run(async () => api.formatIntegration(await api.getIntegration(app_id, integ_id))),
  )

  server.tool(
    "update_integration",
    "Rename or reconfigure an integration. Send the full integration body.",
    { app_id: appId, integ_id: integId, body: jsonBody },
    async ({ app_id, integ_id, body }) =>
      run(async () =>
        `Updated integration.\n${api.formatIntegration(await api.updateIntegration(app_id, integ_id, body))}`,
      ),
  )

  server.tool(
    "delete_integration",
    "Delete an integration from an application.",
    { app_id: appId, integ_id: integId },
    async ({ app_id, integ_id }) =>
      run(async () => {
        await api.deleteIntegration(app_id, integ_id)
        return `Deleted integration ${integ_id}.`
      }),
  )

  server.tool(
    "get_integration_key",
    "Read the key an integration uses to authenticate with Svix.",
    { app_id: appId, integ_id: integId },
    async ({ app_id, integ_id }) =>
      run(async () => api.formatSecret(await api.getIntegrationKey(app_id, integ_id))),
  )

  server.tool(
    "rotate_integration_key",
    "Rotate an integration's key, invalidating the previous one.",
    { app_id: appId, integ_id: integId },
    async ({ app_id, integ_id }) =>
      run(async () => `Rotated.\n${api.formatSecret(await api.rotateIntegrationKey(app_id, integ_id))}`),
  )

  return server
}
