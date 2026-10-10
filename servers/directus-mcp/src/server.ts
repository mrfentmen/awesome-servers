import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listCollections, listUsers, collectionFields, accessReview, instanceHealth } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "directus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Collections (tables) in the Directus instance.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCollections());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Directus users with email, role and status.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listUsers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "collection_fields",
    {
      title: "Data model and fields",
      description: "Every field in a Directus project with its type, interface, required, hidden, readonly and unique flags, and the collection each relational field points at. Lists non-system collections before Directus's own, and flags any non-system collection with no primary key. Without this you cannot write a single correct query against an unfamiliar instance.",
      inputSchema: z.object({
        collection: z.string().optional().describe("Limit to one collection, for example articles."),
        limit: z.number().int().min(1).max(500).default(60).describe("Fields to list per collection, default 60"),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: collection_fields ----
    const paywallMessage = await premiumRequired("collection_fields")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await collectionFields(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "access_review",
    {
      title: "Access review",
      description: "Who can do what in a Directus instance: every role and policy with its user and permission counts, admin-access and two-factor-enforcement flags, IP allowlists, permission rules grouped by action and collection, and the calling token's own per-collection access. Calls out the things that matter: a policy with admin_access, a policy not enforcing 2FA, a role with no policy and no parent, and permission rules with an empty filter, which grant every item.",
      inputSchema: z.object({
        include_permissions: z.string().optional().describe('Set to "false" to skip the permission rules, which is the largest response on a big instance.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: access_review ----
    const paywallMessage = await premiumRequired("access_review")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await accessReview(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "instance_health",
    {
      title: "Instance health and version",
      description: "The Directus instance's own health status per service and its version, database driver and storage adapters. The version decides which features exist, and whether this is a Directus 10 instance where permissions attach to policies rather than roles, which is why an older instance answers the policies endpoint with a 404.",
      inputSchema: z.object({
        check_dependencies: z.string().optional().describe('Set to "false" to skip the dependency summary.'),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await instanceHealth(args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}