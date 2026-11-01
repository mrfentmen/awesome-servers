import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  createAccountCategory,
  createApp,
  deleteInvitation,
  deleteUserAccess,
  errorMessage,
  formatAccessList,
  formatApp,
  formatApps,
  formatCategories,
  formatCategory,
  formatInvitation,
  formatInvitations,
  formatProfiles,
  formatUserAccess,
  getAccountCategory,
  getApp,
  getAppAccess,
  getUserAccess,
  inviteUser,
  listAccessProfiles,
  listAccountCategories,
  listApps,
  listInvitations,
  setUserAccess,
  updateAccountCategory,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "sinao-mcp",
    version: "1.0.0",
  })

  // ------------------------------------------------------------- apps

  server.tool(
    "list_apps",
    "List the Sinao apps the API key can see.",
    {},
    async () => {
      try {
        return text(formatApps(await listApps()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_app",
    "Get one Sinao app by its id.",
    { app_id: z.string().describe("Sinao app id") },
    async ({ app_id }) => {
      try {
        return text(formatApp(await getApp(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_app",
    "Create a new Sinao app.",
    {
      name: z.string().min(1).describe("App name"),
      description: z.string().optional().describe("Optional description"),
    },
    async ({ name, description }) => {
      try {
        return text(formatApp(await createApp(name, description)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // ------------------------------------------------------------ access

  server.tool(
    "get_app_access",
    "List every user with access to an app, with their role and profile.",
    { app_id: z.string().describe("Sinao app id") },
    async ({ app_id }) => {
      try {
        return text(formatAccessList(await getAppAccess(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_access_profiles",
    "List the access profiles (permission templates) available for an app.",
    { app_id: z.string().describe("Sinao app id") },
    async ({ app_id }) => {
      try {
        return text(formatProfiles(await listAccessProfiles(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_invitations",
    "List pending invitations for an app.",
    { app_id: z.string().describe("Sinao app id") },
    async ({ app_id }) => {
      try {
        return text(formatInvitations(await listInvitations(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "invite_user",
    "Invite a user to an app, optionally assigning an access profile.",
    {
      app_id: z.string().describe("Sinao app id"),
      email: z.string().email().describe("Invitee email address"),
      profile_id: z.string().optional().describe("Access profile id to grant"),
    },
    async ({ app_id, email, profile_id }) => {
      try {
        return text(formatInvitation(await inviteUser(app_id, email, profile_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_invitation",
    "Revoke a pending invitation.",
    {
      app_id: z.string().describe("Sinao app id"),
      invitation_id: z.string().describe("Invitation id"),
    },
    async ({ app_id, invitation_id }) => {
      try {
        await deleteInvitation(app_id, invitation_id)
        return text(`Invitation ${invitation_id} deleted.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_user_access",
    "Get one user's access policy on an app.",
    {
      app_id: z.string().describe("Sinao app id"),
      user_id: z.string().describe("Sinao user id"),
    },
    async ({ app_id, user_id }) => {
      try {
        return text(formatUserAccess(await getUserAccess(app_id, user_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "set_user_access",
    "Set or replace a user's access policy on an app.",
    {
      app_id: z.string().describe("Sinao app id"),
      user_id: z.string().describe("Sinao user id"),
      profile_id: z.string().describe("Access profile id to grant"),
      role: z.string().optional().describe("Optional role override"),
    },
    async ({ app_id, user_id, profile_id, role }) => {
      try {
        return text(formatUserAccess(await setUserAccess(app_id, user_id, profile_id, role)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_user_access",
    "Remove a user's access to an app.",
    {
      app_id: z.string().describe("Sinao app id"),
      user_id: z.string().describe("Sinao user id"),
    },
    async ({ app_id, user_id }) => {
      try {
        await deleteUserAccess(app_id, user_id)
        return text(`Access removed for user ${user_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // -------------------------------------------------------- categories

  server.tool(
    "list_account_categories",
    "List the account categories (bookkeeping chart) for an app.",
    { app_id: z.string().describe("Sinao app id") },
    async ({ app_id }) => {
      try {
        return text(formatCategories(await listAccountCategories(app_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_account_category",
    "Get one account category by id.",
    {
      app_id: z.string().describe("Sinao app id"),
      category_id: z.string().describe("Account category id"),
    },
    async ({ app_id, category_id }) => {
      try {
        return text(formatCategory(await getAccountCategory(app_id, category_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_account_category",
    "Create an account category in an app.",
    {
      app_id: z.string().describe("Sinao app id"),
      name: z.string().min(1).describe("Category name"),
      code: z.string().optional().describe("Account code, e.g. 4010"),
      type: z.string().optional().describe("Category type, e.g. revenue or expense"),
    },
    async ({ app_id, name, code, type }) => {
      try {
        return text(formatCategory(await createAccountCategory(app_id, name, code, type)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_account_category",
    "Update the name, code or type of an existing account category.",
    {
      app_id: z.string().describe("Sinao app id"),
      category_id: z.string().describe("Account category id"),
      name: z.string().optional().describe("New name"),
      code: z.string().optional().describe("New account code"),
      type: z.string().optional().describe("New category type"),
    },
    async ({ app_id, category_id, name, code, type }) => {
      try {
        return text(
          formatCategory(await updateAccountCategory(app_id, category_id, { name, code, type }))
        )
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
