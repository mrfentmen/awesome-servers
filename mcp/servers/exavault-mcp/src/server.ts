import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  ExaVaultError,
  copyResources,
  compressResources,
  createEmailList,
  createFolder,
  createNotification,
  deleteEmailList,
  deleteNotification,
  deleteResources,
  extractResources,
  formatAccount,
  formatActivity,
  formatEmailList,
  formatEmailLists,
  formatForm,
  formatForms,
  formatNotification,
  formatNotifications,
  formatResource,
  formatResourceList,
  getAccount,
  getDownloadUrl,
  getEmailList,
  getForm,
  getPreviewUrl,
  getResource,
  getSessionActivity,
  getWebhookActivity,
  listEmailLists,
  listFolderContents,
  listForms,
  listNotifications,
  listResources,
  moveResources,
  updateAccount,
} from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })

const fail = (value: string) => ({
  content: [{ type: "text" as const, text: value }],
  isError: true as const,
})

function errorMessage(error: unknown): string {
  if (error instanceof ExaVaultError) return `ExaVault error: ${error.message}`
  if (error instanceof Error) return `Error: ${error.message}`
  return `Error: ${String(error)}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "exavault-mcp", version: "1.0.0" })

  server.tool(
    "get_account",
    "Read the ExaVault account behind the configured API credentials: company, contact details, plan, storage quota and user count.",
    {},
    async () => {
      try {
        return text(formatAccount(await getAccount()))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "update_account",
    "Update account settings such as company name, contact name, email, phone or timezone. Only the fields you pass are sent.",
    {
      company: z.string().optional().describe("Company name"),
      contactName: z.string().optional().describe("Account contact name"),
      email: z.string().optional().describe("Contact email address"),
      phone: z.string().optional().describe("Contact phone number"),
      timezone: z.string().optional().describe("Timezone name, for example America/New_York"),
    },
    async (args) => {
      try {
        return text(formatAccount(await updateAccount(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_resources",
    "List files and folders at a path in the ExaVault account, optionally sorted and paged.",
    {
      path: z.string().optional().describe("Folder path, for example / or /Clients/Acme. Defaults to the account root"),
      sortBy: z.string().optional().describe("Field to sort by, for example name, size or modified"),
      sortOrder: z.string().optional().describe("Sort direction: asc or desc"),
      limit: z.number().int().min(1).optional().describe("Maximum rows to return"),
      offset: z.number().int().min(0).optional().describe("Rows to skip, for paging"),
    },
    async (args) => {
      try {
        const where = args.path ?? "/"
        return text(formatResourceList(await listResources(args), where))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_folder_contents",
    "List the contents of one folder by its ExaVault resource id, which is what the account UI and share links use.",
    {
      id: z.number().int().describe("ExaVault resource id of the folder"),
      sortBy: z.string().optional().describe("Field to sort by, for example name or modified"),
      sortOrder: z.string().optional().describe("Sort direction: asc or desc"),
    },
    async (args) => {
      try {
        return text(formatResourceList(await listFolderContents(args), `folder ${args.id}`))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_resource",
    "Read the properties of a single file or folder: type, size, uploader and timestamps.",
    {
      path: z.string().describe("Full path of the resource, for example /Clients/Acme/report.pdf"),
      type: z.string().optional().describe("Resource type hint: file or folder"),
    },
    async (args) => {
      try {
        return text(formatResource(await getResource(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "create_folder",
    "Create a new folder inside an existing folder path.",
    {
      path: z.string().describe("Parent folder path, for example /Clients"),
      name: z.string().describe("Name of the new folder"),
    },
    async (args) => {
      try {
        return text(`Created folder:\n${formatResource(await createFolder(args))}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "delete_resources",
    "Destructively delete a file or folder at a path. Set recursive to true to delete a folder and everything inside it.",
    {
      path: z.string().describe("Path of the file or folder to delete"),
      recursive: z.boolean().optional().describe("Delete a folder and all of its contents"),
    },
    async (args) => {
      try {
        const result = await deleteResources(args)
        return text(args.recursive ? `${result}\nThis was a recursive delete.` : result)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "copy_resources",
    "Copy one or more files or folders to a destination folder path inside the same account.",
    {
      resources: z.array(z.string()).min(1).describe("Source paths, for example ['/a/b.pdf', '/a/c']"),
      destinationPath: z.string().describe("Destination folder path, for example /Archive"),
    },
    async (args) => {
      try {
        return text(await copyResources(args))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "move_resources",
    "Move one or more files or folders to a destination folder path. The source paths no longer exist afterwards.",
    {
      resources: z.array(z.string()).min(1).describe("Source paths to move"),
      destinationPath: z.string().describe("Destination folder path"),
    },
    async (args) => {
      try {
        return text(await moveResources(args))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "compress_resources",
    "Zip one or more resources into a single archive stored at a destination folder path.",
    {
      resources: z.array(z.string()).min(1).describe("Paths to include in the archive"),
      destinationPath: z.string().describe("Folder where the archive is written"),
      name: z.string().optional().describe("Archive file name, for example bundle.zip"),
    },
    async (args) => {
      try {
        return text(await compressResources(args))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "extract_resources",
    "Extract one or more zip archives into a destination folder path.",
    {
      resources: z.array(z.string()).min(1).describe("Archive paths to extract"),
      destinationPath: z.string().describe("Folder to extract into"),
    },
    async (args) => {
      try {
        return text(await extractResources(args))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_download_url",
    "Get a direct download URL for a file so it can be fetched outside the API.",
    {
      path: z.string().describe("Path of the file to download"),
    },
    async (args) => {
      try {
        const url = await getDownloadUrl(args)
        return url ? text(url) : fail(`ExaVault returned no download URL for ${args.path}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_preview_url",
    "Get a preview URL for an image or document, optionally at a named thumbnail size.",
    {
      path: z.string().describe("Path of the file to preview"),
      size: z.string().optional().describe("Preview size, for example small, medium or large"),
    },
    async (args) => {
      try {
        const url = await getPreviewUrl(args)
        return url ? text(url) : fail(`ExaVault returned no preview URL for ${args.path}`)
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_email_lists",
    "List the email groups configured on the account, with their addresses and ids.",
    {
      limit: z.number().int().min(1).optional().describe("Maximum lists to return"),
      offset: z.number().int().min(0).optional().describe("Lists to skip, for paging"),
    },
    async (args) => {
      try {
        return text(formatEmailLists(await listEmailLists(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "create_email_list",
    "Create a new email group that receive forms and share notifications can be sent to.",
    {
      name: z.string().describe("Display name of the email group"),
      address: z.string().describe("Group email address"),
    },
    async (args) => {
      try {
        return text(formatEmailList(await createEmailList(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_email_list",
    "Read one email group by id.",
    {
      id: z.number().int().describe("Email group id"),
    },
    async (args) => {
      try {
        return text(formatEmailList(await getEmailList(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "delete_email_list",
    "Permanently delete an email group by id.",
    {
      id: z.number().int().describe("Email group id"),
    },
    async (args) => {
      try {
        return text(await deleteEmailList(args))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_notifications",
    "List the event notifications configured on the account, such as upload or share alerts.",
    {
      limit: z.number().int().min(1).optional().describe("Maximum notifications to return"),
      offset: z.number().int().min(0).optional().describe("Notifications to skip, for paging"),
    },
    async (args) => {
      try {
        return text(formatNotifications(await listNotifications(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "create_notification",
    "Create an event notification that emails an address when a matching event happens.",
    {
      type: z.string().describe("Event type, for example upload, download or share"),
      email: z.string().describe("Address to notify"),
      message: z.string().optional().describe("Custom message included in the notification"),
    },
    async (args) => {
      try {
        return text(formatNotification(await createNotification(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "delete_notification",
    "Permanently delete an event notification by id.",
    {
      id: z.number().int().describe("Notification id"),
    },
    async (args) => {
      try {
        return text(await deleteNotification(args))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_session_activity",
    "Read the account's session activity log, optionally narrowed to a date range and event type.",
    {
      startDate: z.string().optional().describe("Start date, for example 2026-01-01"),
      endDate: z.string().optional().describe("End date, for example 2026-01-31"),
      type: z.string().optional().describe("Activity type filter, for example login or upload"),
      limit: z.number().int().min(1).optional().describe("Maximum rows to return"),
    },
    async (args) => {
      try {
        return text(formatActivity(await getSessionActivity(args), "session"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_webhook_activity",
    "Read the webhook delivery log, which shows which outbound webhook calls the account made.",
    {
      limit: z.number().int().min(1).optional().describe("Maximum rows to return"),
    },
    async (args) => {
      try {
        return text(formatActivity(await getWebhookActivity(args), "webhook"))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "list_forms",
    "List the receive forms on the account: the public upload pages that file into a folder.",
    {},
    async () => {
      try {
        return text(formatForms(await listForms()))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  server.tool(
    "get_form",
    "Read one receive form by id: its name, target path and submission count.",
    {
      id: z.number().int().describe("Receive form id"),
    },
    async (args) => {
      try {
        return text(formatForm(await getForm(args)))
      } catch (error) {
        return fail(errorMessage(error))
      }
    },
  )

  return server
}
