import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  EtherpadError,
  appendChatMessage,
  appendText,
  baseUrl,
  checkToken,
  copyPad,
  createAuthor,
  createGroup,
  createGroupPad,
  createPad,
  createSession,
  deleteGroup,
  deletePad,
  formatCount,
  formatPadRef,
  formatPadUsers,
  formatPads,
  formatText,
  formatTimestamp,
  formatYesNo,
  getAuthorName,
  getHTML,
  getLastEdited,
  getPublicStatus,
  getReadOnlyID,
  getRevisionsCount,
  getSavedRevisionsCount,
  getText,
  isPasswordProtected,
  listAllPads,
  listAuthorsOfPad,
  listGroupPads,
  listGroups,
  listPads,
  listSavedRevisions,
  listSessionsOfGroup,
  movePad,
  padUsers,
  padUsersCount,
  saveRevision,
  setPassword,
  setPublicStatus,
  setText,
} from "./api.js"

function text(body: string): { content: { type: "text"; text: string }[] } {
  return { content: [{ type: "text", text: body }] }
}

function fail(body: string): { content: { type: "text"; text: string }[]; isError: true } {
  return { content: [{ type: "text", text: body }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof EtherpadError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const padID = z.string().min(1).describe("Pad ID, for example 'my-notes' or 'g.abc123$my-notes' for a group pad")
const groupID = z.string().min(1).describe("Group ID returned by create_group")
const authorID = z.string().min(1).describe("Author ID returned by create_author")

export function createServer(): McpServer {
  const server = new McpServer({ name: "etherpad-mcp", version: "1.0.0" })

  server.tool(
    "instance_info",
    "Show which Etherpad instance this server talks to and whether the API key is accepted.",
    {},
    async () => {
      try {
        const valid = await checkToken()
        return text(`Instance: ${baseUrl()}\nAPI key accepted: ${valid ? "yes" : "no"}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_pad",
    "Create a new pad. Fails if the pad already exists; use set_text to write into an existing pad.",
    { padID, text: z.string().optional().describe("Initial pad content") },
    async (args) => {
      try {
        return text(formatPadRef(await createPad(args.padID, args.text)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_pad",
    "DESTRUCTIVE: permanently delete a pad and its whole revision history.",
    { padID },
    async (args) => {
      try {
        await deletePad(args.padID)
        return text(`Deleted pad ${args.padID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "copy_pad",
    "Copy a pad's content and history to a new pad ID.",
    {
      sourceID: z.string().min(1).describe("Pad to copy from"),
      destinationID: z.string().min(1).describe("Pad to copy to"),
      force: z.boolean().optional().describe("Overwrite the destination if it already exists"),
    },
    async (args) => {
      try {
        return text(formatPadRef(await copyPad(args.sourceID, args.destinationID, args.force ?? false)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "move_pad",
    "Rename a pad by moving it to a new pad ID.",
    {
      sourceID: z.string().min(1).describe("Current pad ID"),
      destinationID: z.string().min(1).describe("New pad ID"),
      force: z.boolean().optional().describe("Overwrite the destination if it already exists"),
    },
    async (args) => {
      try {
        return text(formatPadRef(await movePad(args.sourceID, args.destinationID, args.force ?? false)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_text",
    "Read a pad's plain text, optionally at a specific revision.",
    { padID, rev: z.string().optional().describe("Revision number; omit for the latest") },
    async (args) => {
      try {
        return text(formatText(await getText(args.padID, args.rev)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "set_text",
    "Replace a pad's entire content with new text.",
    { padID, text: z.string().describe("New pad content") },
    async (args) => {
      try {
        await setText(args.padID, args.text)
        return text(`Replaced the content of ${args.padID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "append_text",
    "Append text to the end of a pad without touching what is already there.",
    { padID, text: z.string().describe("Text to append") },
    async (args) => {
      try {
        await appendText(args.padID, args.text)
        return text(`Appended ${args.text.length} character(s) to ${args.padID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_html",
    "Read a pad rendered as HTML.",
    { padID, rev: z.string().optional().describe("Revision number; omit for the latest") },
    async (args) => {
      try {
        const html = await getHTML(args.padID, args.rev)
        return text(html === "" ? "(pad is empty)" : html)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_revision_count",
    "Count how many revisions a pad has.",
    { padID },
    async (args) => {
      try {
        return text(formatCount(await getRevisionsCount(args.padID), `Revisions in ${args.padID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_saved_revision_count",
    "Count how many revisions of a pad were explicitly saved.",
    { padID },
    async (args) => {
      try {
        return text(formatCount(await getSavedRevisionsCount(args.padID), `Saved revisions in ${args.padID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_saved_revisions",
    "List the revision numbers of a pad that were explicitly saved.",
    { padID },
    async (args) => {
      try {
        const revs = await listSavedRevisions(args.padID)
        if (revs.length === 0) return text(`No saved revisions in ${args.padID}.`)
        return text([`${revs.length} saved revision(s):`, ...revs.map((r, i) => `${i + 1}. ${r}`)].join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "save_revision",
    "Pin a revision of a pad so it is kept by the instance's cleaning job.",
    { padID, rev: z.number().int().min(0).describe("Revision number to save") },
    async (args) => {
      try {
        await saveRevision(args.padID, args.rev)
        return text(`Saved revision ${args.rev} of ${args.padID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_last_edited",
    "When a pad was last edited.",
    { padID },
    async (args) => {
      try {
        return text(formatTimestamp(await getLastEdited(args.padID), `Last edited ${args.padID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_all_pads",
    "List every pad on the instance.",
    {},
    async () => {
      try {
        return text(formatPads(await listAllPads(), "pad(s) on this instance"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_pads",
    "List the pads inside a group.",
    { groupID },
    async (args) => {
      try {
        return text(formatPads(await listPads(args.groupID), `pad(s) in group ${args.groupID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("create_group", "Create a new group that can hold several pads.", {}, async () => {
    try {
      const id = await createGroup()
      return text(`Created group ${id === "" ? "(no id returned)" : id}.`)
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "delete_group",
    "DESTRUCTIVE: delete a group. Pads inside it are not deleted by every Etherpad version.",
    { groupID },
    async (args) => {
      try {
        await deleteGroup(args.groupID)
        return text(`Deleted group ${args.groupID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_groups", "List every group on the instance.", {}, async () => {
    try {
      return text(formatPads(await listGroups(), "group(s) on this instance"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "create_group_pad",
    "Create a pad inside a group.",
    {
      groupID,
      padName: z.string().min(1).describe("Pad name inside the group, for example 'meeting-notes'"),
      text: z.string().optional().describe("Initial pad content"),
    },
    async (args) => {
      try {
        return text(formatPadRef(await createGroupPad(args.groupID, args.padName, args.text)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_group_pads",
    "List the pads of a group.",
    { groupID },
    async (args) => {
      try {
        return text(formatPads(await listGroupPads(args.groupID), `pad(s) in group ${args.groupID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_pad_authors",
    "List the author IDs that have edited a pad.",
    { padID },
    async (args) => {
      try {
        return text(formatPads(await listAuthorsOfPad(args.padID), `author(s) of ${args.padID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_pad_users",
    "List the users currently connected to a pad.",
    { padID },
    async (args) => {
      try {
        return text(formatPadUsers(await padUsers(args.padID)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "count_pad_users",
    "Count the users currently connected to a pad.",
    { padID },
    async (args) => {
      try {
        return text(formatCount(await padUsersCount(args.padID), `Users on ${args.padID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_author",
    "Create an author identity, used for sessions and chat messages.",
    { name: z.string().optional().describe("Display name for the author") },
    async (args) => {
      try {
        const id = await createAuthor(args.name)
        return text(`Created author ${id === "" ? "(no id returned)" : id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_author_name",
    "Look up an author's display name.",
    { authorID },
    async (args) => {
      try {
        const name = await getAuthorName(args.authorID)
        return text(name === "" ? `Author ${args.authorID} has no name.` : `Author ${args.authorID}: ${name}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "set_public_status",
    "Make a pad publicly readable, or private again.",
    {
      padID,
      publicStatus: z.boolean().describe("true makes the pad public, false makes it private"),
    },
    async (args) => {
      try {
        await setPublicStatus(args.padID, args.publicStatus)
        return text(`${args.padID} is now ${args.publicStatus ? "public" : "private"}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("get_public_status", "Check whether a pad is public.", { padID }, async (args) => {
    try {
      return text(formatYesNo(await getPublicStatus(args.padID), `Public ${args.padID}`))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "set_password",
    "DESTRUCTIVE: set or change the password that protects a pad.",
    { padID, password: z.string().min(1).describe("New password for the pad") },
    async (args) => {
      try {
        await setPassword(args.padID, args.password)
        return text(`Password set on ${args.padID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("is_password_protected", "Check whether a pad is password protected.", { padID }, async (args) => {
    try {
      return text(formatYesNo(await isPasswordProtected(args.padID), `Password protected ${args.padID}`))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_read_only_id",
    "Get the read-only ID of a pad, for sharing a view-only link.",
    { padID },
    async (args) => {
      try {
        const id = await getReadOnlyID(args.padID)
        return text(id === "" ? `No read-only ID for ${args.padID}.` : `Read-only ID for ${args.padID}: ${id}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_session",
    "Create a session that signs an author into a group until a given time.",
    {
      groupID,
      authorID,
      validUntil: z.number().int().positive().describe("Unix timestamp in milliseconds when the session expires"),
    },
    async (args) => {
      try {
        const id = await createSession(args.groupID, args.authorID, args.validUntil)
        return text(id === "" ? "No session ID returned." : `Created session ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_group_sessions",
    "List the session IDs of a group.",
    { groupID },
    async (args) => {
      try {
        return text(formatPads(await listSessionsOfGroup(args.groupID), `session(s) in group ${args.groupID}`))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "append_chat_message",
    "Append a message to a pad's chat box.",
    {
      padID,
      text: z.string().min(1).describe("Chat message"),
      authorID,
      time: z.number().int().optional().describe("Unix timestamp in milliseconds; defaults to now"),
    },
    async (args) => {
      try {
        await appendChatMessage(args.padID, args.text, args.authorID, args.time)
        return text(`Chat message added to ${args.padID}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
