import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  DracoonError,
  addGroupUsers,
  completeUpload,
  createGroup,
  createUploadChannel,
  deleteGroup,
  deleteNodes,
  formatGroup,
  formatGroupUser,
  formatNode,
  formatRoom,
  getGroup,
  listGroupRooms,
  listGroupUsers,
  listGroups,
  listNodes,
  login,
  removeGroupUsers,
  toggleFavorite,
  updateGroup,
  uploadBytes,
  uploadStatus,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

function errorMessage(e: unknown): string {
  if (e instanceof DracoonError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dracoon-mcp",
    version: "1.0.0",
  })

  server.tool(
    "login",
    "Exchange DRACOON user credentials for an access token. Put the returned token in DRACOON_ACCESS_TOKEN.",
    {
      user_name: z.string().describe("DRACOON username, usually an email address"),
      password: z.string().describe("DRACOON password"),
    },
    async ({ user_name, password }) => {
      try {
        const session = await login(user_name, password)
        if (!session.token) return fail("Login succeeded but DRACOON returned no token.")
        return text(`Access token obtained. Set DRACOON_ACCESS_TOKEN to:\n${session.token}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_groups", "List the user groups on this DRACOON tenant.", {}, async () => {
    try {
      const groups = await listGroups()
      if (groups.length === 0) return text("No groups on this tenant.")
      return text(groups.map((g, i) => `${i + 1}. ${formatGroup(g)}`).join("\n"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_group",
    "Get one user group by id.",
    { group_id: z.number().int().describe("DRACOON group id") },
    async ({ group_id }) => {
      try {
        return text(formatGroup(await getGroup(group_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_group",
    "Create a user group.",
    {
      name: z.string().describe("Group name"),
      description: z.string().optional().describe("Optional group description"),
    },
    async ({ name, description }) => {
      try {
        return text(`Created: ${formatGroup(await createGroup(name, description))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_group",
    "Rename or re-describe a user group.",
    {
      group_id: z.number().int().describe("DRACOON group id"),
      name: z.string().describe("New group name"),
      description: z.string().optional().describe("New description"),
    },
    async ({ group_id, name, description }) => {
      try {
        return text(`Updated: ${formatGroup(await updateGroup(group_id, name, description))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_group",
    "Delete a user group. This cannot be undone.",
    { group_id: z.number().int().describe("DRACOON group id") },
    async ({ group_id }) => {
      try {
        await deleteGroup(group_id)
        return text(`Deleted group ${group_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_group_rooms",
    "List rooms granted to a group, or that can be granted to it.",
    { group_id: z.number().int().describe("DRACOON group id") },
    async ({ group_id }) => {
      try {
        const rooms = await listGroupRooms(group_id)
        if (rooms.length === 0) return text("No rooms for this group.")
        return text(rooms.map((r, i) => `${i + 1}. ${formatRoom(r)}`).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_group_users",
    "List members of a group, or users who could become members.",
    { group_id: z.number().int().describe("DRACOON group id") },
    async ({ group_id }) => {
      try {
        const users = await listGroupUsers(group_id)
        if (users.length === 0) return text("No users for this group.")
        return text(users.map((u, i) => `${i + 1}. ${formatGroupUser(u)}`).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "add_group_users",
    "Add users to a group.",
    {
      group_id: z.number().int().describe("DRACOON group id"),
      user_ids: z.array(z.number().int()).min(1).describe("User ids to add"),
    },
    async ({ group_id, user_ids }) => {
      try {
        await addGroupUsers(group_id, user_ids)
        return text(`Added ${user_ids.length} user(s) to group ${group_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "remove_group_users",
    "Remove users from a group.",
    {
      group_id: z.number().int().describe("DRACOON group id"),
      user_ids: z.array(z.number().int()).min(1).describe("User ids to remove"),
    },
    async ({ group_id, user_ids }) => {
      try {
        await removeGroupUsers(group_id, user_ids)
        return text(`Removed ${user_ids.length} user(s) from group ${group_id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_nodes",
    "List files and folders inside a container. Use parent_id 0 for the root.",
    {
      parent_id: z.number().int().default(0).describe("Container node id, 0 for root"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      limit: z.number().int().min(1).max(500).default(50).describe("Page size"),
    },
    async ({ parent_id, offset, limit }) => {
      try {
        const nodes = await listNodes(parent_id, offset, limit)
        if (nodes.length === 0) return text(`Nothing in container ${parent_id}.`)
        return text(nodes.map((n, i) => `${i + 1}. ${formatNode(n)}`).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_nodes",
    "Delete nodes. They go to the recycle bin, where they can still be restored.",
    { node_ids: z.array(z.number().int()).min(1).describe("Node ids to delete") },
    async ({ node_ids }) => {
      try {
        await deleteNodes(node_ids)
        return text(`Deleted ${node_ids.length} node(s).`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "toggle_favorite",
    "Mark or unmark nodes as favorites.",
    {
      node_ids: z.array(z.number().int()).min(1).describe("Node ids"),
      is_favorite: z.boolean().describe("true to favorite, false to unfavorite"),
    },
    async ({ node_ids, is_favorite }) => {
      try {
        await toggleFavorite(node_ids, is_favorite)
        return text(`${is_favorite ? "Favorited" : "Unfavorited"} ${node_ids.length} node(s).`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_upload_channel",
    "Open a file upload channel inside a folder. Returns the upload id and the pre-signed URL for the bytes.",
    {
      parent_id: z.number().int().describe("Target folder node id"),
      name: z.string().describe("File name including extension"),
      size: z.number().int().min(0).describe("File size in bytes"),
      classification: z.number().int().min(1).max(4).default(1).describe("DRACOON classification level 1-4"),
    },
    async ({ parent_id, name, size, classification }) => {
      try {
        const channel = await createUploadChannel(parent_id, name, size, classification)
        if (!channel.uploadId) return fail("DRACOON did not return an upload id.")
        const lines = [
          `upload_id: ${channel.uploadId}`,
          channel.uploadUrl ? `upload_url: ${channel.uploadUrl}` : "upload_url: not returned",
          channel.parts ? `parts: ${channel.parts}` : "",
          "",
          "Next: call upload_file with this upload_url, then complete_upload with the upload_id.",
        ].filter(Boolean)
        return text(lines.join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "upload_file",
    "PUT file bytes to the pre-signed upload URL from create_upload_channel. Text content only; use this for small files.",
    {
      upload_url: z.string().url().describe("Pre-signed upload URL returned by create_upload_channel"),
      content: z.string().describe("File content as text"),
    },
    async ({ upload_url, content }) => {
      try {
        const res = await uploadBytes(upload_url, content)
        return text(`Uploaded ${res.bytes} bytes. Now call complete_upload with the upload_id.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "complete_upload",
    "Finalise an upload after the bytes are sent. The file appears in DRACOON after this.",
    { upload_id: z.string().describe("Upload id from create_upload_channel") },
    async ({ upload_id }) => {
      try {
        const node = await completeUpload(upload_id)
        return text(`Upload complete: node ${node.nodeId ?? "?"} ${node.name ?? ""}`.trim())
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "upload_status",
    "Check the status of an upload channel.",
    { upload_id: z.string().describe("Upload id from create_upload_channel") },
    async ({ upload_id }) => {
      try {
        return text(formatNode(await uploadStatus(upload_id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
