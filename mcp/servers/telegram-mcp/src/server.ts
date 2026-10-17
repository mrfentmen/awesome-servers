import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, getMe, sendMessage, getUpdates, chatInfo, memberCount, fileInfo, sendPhoto, myCommands, deleteMessage, editMessage, messageLimitAudit, inlineKeyboardAudit, deepLinkBuilder } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "telegram-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "get_me",
    {
      title: "Bot info",
      description: "Bot identity: username, id and capabilities.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await getMe());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "send_message",
    {
      title: "Send message",
      description: "Send a REAL message to a chat.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID, e.g. -1001234567890"),
        message: z.string().describe("Message text.")
      }),
      annotations: MUTATING,
    },
    async ({ chat_id, message }) => {
      try {
        return text(await sendMessage(chat_id, message));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_updates",
    {
      title: "Get updates",
      description: "Incoming updates from the last 24 hours.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await getUpdates(limit));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "chat_info",
    {
      title: "Chat info",
      description: "Chat details.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ chat_id }) => {
      try {
        return text(await chatInfo(chat_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "member_count",
    {
      title: "Member count",
      description: "Chat size.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ chat_id }) => {
      try {
        return text(await memberCount(chat_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "file_info",
    {
      title: "File info",
      description: "File path by ID.",
      inputSchema: z.object({
        file_id: z.string().describe("File ID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ file_id }) => {
      try {
        return text(await fileInfo(file_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "send_photo",
    {
      title: "Send photo",
      description: "Send a REAL photo message.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID."),
        photo_url: z.string().describe("Image URL."),
        caption: z.string().describe("Caption.").optional()
      }),
      annotations: MUTATING,
    },
    async ({ chat_id, photo_url, caption }) => {
      try {
        return text(await sendPhoto(chat_id, photo_url, caption));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "my_commands",
    {
      title: "Bot commands",
      description: "Registered commands.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await myCommands());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "delete_message",
    {
      title: "Delete message",
      description: "Delete a REAL message.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID."),
        message_id: z.string().describe("Message ID.")
      }),
      annotations: MUTATING,
    },
    async ({ chat_id, message_id }) => {
      try {
        return text(await deleteMessage(chat_id, message_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "edit_message",
    {
      title: "Edit message",
      description: "Edit a REAL message.",
      inputSchema: z.object({
        chat_id: z.string().describe("Chat ID."),
        message_id: z.string().describe("Message ID."),
        message: z.string().describe("New text.")
      }),
      annotations: MUTATING,
    },
    async ({ chat_id, message_id, message }) => {
      try {
        return text(await editMessage(chat_id, message_id, message));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "message_limit_audit",
    {
      title: "Message limit audit",
      description: "Check a message against the Bot API's documented hard limits before you send it: the 4096 character text limit and how many calls a long text needs, the 1024 character media caption limit, and the parse_mode traps that make Telegram reject a whole message, from an unbalanced asterisk to an unescaped MarkdownV2 special character or a bare angle bracket in HTML mode.",
      inputSchema: z.object({
        text: z.string().describe("The message text you intend to send.").optional(),
        caption: z.string().describe("The caption, if this is a media message.").optional(),
        parse_mode: z.string().describe("Markdown, MarkdownV2 or HTML, if you set one.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await messageLimitAudit(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "inline_keyboard_audit",
    {
      title: "Inline keyboard audit",
      description: "Audit an inline keyboard against the documented limits: every row's button count and byte cost, callback_data measured in bytes rather than characters, buttons with no action, malformed or unsupported button URLs, https enforcement on web_app buttons, and the rule that one invalid button makes Telegram reject the entire keyboard.",
      inputSchema: z.object({ keyboard: z.string().describe("The inline keyboard as JSON, e.g. [[{\"text\":\"Yes\",\"callback_data\":\"y\"}]].") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await inlineKeyboardAudit(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "deep_link_builder",
    {
      title: "Deep link builder",
      description: "Build a t.me link with the encoding done properly: validate a username against the documented 5 to 32 character rule and say which part failed, produce a correctly percent-encoded start-parameter link, a share link with both parameters encoded, or the public and private forms of a channel link including invite hashes.",
      inputSchema: z.object({
        username: z.string().describe("Bot or channel username, with or without the @.").optional(),
        payload: z.string().describe("start parameter to carry, up to 64 base64url characters.").optional(),
        url: z.string().describe("The URL to share, for a share link.").optional(),
        text: z.string().describe("Prefilled share text.").optional(),
        kind: z.string().describe("start, share or channel. Inferred from the arguments if omitted.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await deepLinkBuilder(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}