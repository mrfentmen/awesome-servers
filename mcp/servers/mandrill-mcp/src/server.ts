import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  MandrillError,
  addInboundDomain,
  addSubaccount,
  addTemplate,
  addWebhook,
  cancelScheduledMessage,
  deleteReject,
  deleteTag,
  deleteTemplate,
  deleteWebhook,
  formatMessage,
  formatReject,
  formatRows,
  formatSendResults,
  formatSubaccount,
  formatTag,
  formatTemplate,
  formatWebhook,
  getMessageContent,
  getMessageInfo,
  getTemplate,
  getUserInfo,
  listExports,
  listInboundDomains,
  listInboundRoutes,
  listMetadata,
  listRejects,
  listScheduledMessages,
  listSenders,
  listSubaccounts,
  listTags,
  listTemplates,
  listUrls,
  listWebhooks,
  parseEmail,
  ping as mandrillPing,
  publishTemplate,
  renderTemplate,
  rescheduleMessage,
  searchMessages,
  sendEmail,
  sendRawEmail,
  sendTemplateEmail,
  updateTemplate,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })

/** The flat recipient object Mandrill's `message.to` expects. */
const recipient = z.object({
  email: z.string().describe("Recipient email address"),
  name: z.string().optional().describe("Recipient display name"),
  type: z.enum(["to", "cc", "bcc"]).optional().describe("Recipient type, defaults to 'to'"),
})

export function createServer(): McpServer {
  const server = new McpServer({
    name: "mandrill-mcp",
    version: "1.0.0",
  })

  // ------------------------------------------------------------- messages

  server.tool(
    "send_email",
    "Send a transactional email through Mandrill. This sends real mail from a verified domain.",
    {
      to: z.array(recipient).min(1).describe("Recipients"),
      from_email: z.string().describe("Verified sending address"),
      from_name: z.string().optional().describe("Sender display name"),
      subject: z.string().describe("Subject line"),
      html: z.string().optional().describe("HTML body"),
      text: z.string().optional().describe("Plain-text body (auto-generated when omitted)"),
      tags: z.array(z.string()).optional().describe("Tags for reporting"),
      important: z.boolean().optional().describe("Mark the message as important"),
      track_opens: z.boolean().optional().describe("Track opens"),
      track_clicks: z.boolean().optional().describe("Track clicks"),
    },
    async (args) => {
      try {
        const message: Record<string, unknown> = {
          to: args.to,
          from_email: args.from_email,
          from_name: args.from_name,
          subject: args.subject,
          html: args.html,
          text: args.text,
          tags: args.tags,
          important: args.important,
          track_opens: args.track_opens,
          track_clicks: args.track_clicks,
        }
        return text(formatSendResults(await sendEmail(stripUndefined(message))))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "send_template_email",
    "Send an email rendered from a stored Mandrill template.",
    {
      template_name: z.string().describe("Template slug"),
      to: z.array(recipient).min(1).describe("Recipients"),
      from_email: z.string().describe("Verified sending address"),
      from_name: z.string().optional().describe("Sender display name"),
      subject: z.string().optional().describe("Override the template subject"),
      merge_vars: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Per-recipient merge vars: [{rcpt: 'a@b.c', vars: [{name, content}]}]"),
      template_content: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Handlebars replacements: [{name, content}]"),
    },
    async (args) => {
      try {
        const message = stripUndefined({
          to: args.to,
          from_email: args.from_email,
          from_name: args.from_name,
          subject: args.subject,
          merge_vars: args.merge_vars,
        })
        const results = await sendTemplateEmail(args.template_name, args.template_content ?? [], message)
        return text(formatSendResults(results))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "send_raw_email",
    "Send a pre-built MIME message through Mandrill.",
    {
      raw_message: z.string().describe("Full MIME message, including headers"),
      to: z.array(z.string()).min(1).describe("Recipient addresses"),
      from_email: z.string().describe("Verified sending address"),
      from_name: z.string().optional().describe("Sender display name"),
      subject: z.string().optional().describe("Subject override"),
    },
    async (args) => {
      try {
        const results = await sendRawEmail({
          rawMessage: args.raw_message,
          to: args.to,
          fromEmail: args.from_email,
          fromName: args.from_name,
          subject: args.subject,
        })
        return text(formatSendResults(results))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_messages",
    "Search sent messages by Mandrill's search syntax, e.g. 'email:someone@example.com'.",
    {
      query: z.string().describe("Search query"),
      limit: z.number().int().min(1).max(1000).optional().describe("Max results, Mandrill defaults to 100"),
      date_from: z.string().optional().describe("ISO 8601 start date"),
      date_to: z.string().optional().describe("ISO 8601 end date"),
    },
    async ({ query, limit, date_from, date_to }) => {
      try {
        const messages = await searchMessages(query, { limit, dateFrom: date_from, dateTo: date_to })
        if (messages.length === 0) return text("No messages matched that query.")
        return text(`Messages (${messages.length}):\n\n` + messages.map((m, i) => formatMessage(m, i)).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_message_info",
    "Get delivery details and open/click counts for one message.",
    { id: z.string().describe("Mandrill message id") },
    async ({ id }) => {
      try {
        const message = await getMessageInfo(id)
        if (!message) return text(`No message with id ${id}.`)
        return text(formatMessage(message))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_message_content",
    "Get the stored HTML body of a sent message.",
    { id: z.string().describe("Mandrill message id") },
    async ({ id }) => {
      try {
        return text(await getMessageContent(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_scheduled_messages",
    "List messages that are scheduled but not sent yet.",
    { to: z.string().optional().describe("Only messages to this address") },
    async ({ to }) => {
      try {
        const messages = await listScheduledMessages(to)
        if (messages.length === 0) return text("No scheduled messages.")
        return text(`Scheduled (${messages.length}):\n\n` + messages.map((m, i) => formatMessage(m, i)).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_scheduled_message",
    "Cancel a scheduled message. Destructive: the message will not be sent.",
    { id: z.string().describe("Mandrill message id") },
    async ({ id }) => {
      try {
        return text(await cancelScheduledMessage(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "reschedule_message",
    "Move a scheduled message to a new send time.",
    {
      id: z.string().describe("Mandrill message id"),
      send_at: z.string().describe("New send time, ISO 8601 with timezone"),
    },
    async ({ id, send_at }) => {
      try {
        return text(await rescheduleMessage(id, send_at))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "parse_email",
    "Parse a raw MIME message and return Mandrill's extracted headers, body and attachments.",
    { raw_message: z.string().describe("Full MIME message") },
    async ({ raw_message }) => {
      try {
        const parsed = await parseEmail(raw_message)
        if (Object.keys(parsed).length === 0) return text("Mandrill returned an empty parse result.")
        return text(formatRows([parsed], "Mandrill returned an empty parse result."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // ------------------------------------------------------------ templates

  server.tool(
    "add_template",
    "Create a Mandrill template from Handlebars code.",
    {
      name: z.string().describe("Template name"),
      code: z.string().describe("Handlebars template source"),
      from_email: z.string().optional().describe("Default sender address"),
      from_name: z.string().optional().describe("Default sender name"),
      subject: z.string().optional().describe("Default subject"),
      text: z.string().optional().describe("Plain-text part"),
    },
    async (args) => {
      try {
        const created = await addTemplate({
          name: args.name,
          code: args.code,
          fromEmail: args.from_email,
          fromName: args.from_name,
          subject: args.subject,
          text: args.text,
        })
        return text(formatTemplate(created))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool("list_templates", "List every template in the account.", {}, async () => {
    try {
      const templates = await listTemplates()
      if (templates.length === 0) return text("No templates in this account.")
      return text(`Templates (${templates.length}):\n\n` + templates.map((t, i) => formatTemplate(t, i)).join("\n"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "get_template",
    "Get one template by name.",
    { name: z.string().describe("Template name") },
    async ({ name }) => {
      try {
        const template = await getTemplate(name)
        if (!template) return text(`No template named ${name}.`)
        return text(formatTemplate(template))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_template",
    "Update a template's code, subject or sender defaults.",
    {
      name: z.string().describe("Template name"),
      code: z.string().optional().describe("New Handlebars source"),
      from_email: z.string().optional().describe("Default sender address"),
      from_name: z.string().optional().describe("Default sender name"),
      subject: z.string().optional().describe("Default subject"),
      text: z.string().optional().describe("Plain-text part"),
    },
    async (args) => {
      try {
        const updated = await updateTemplate(args.name, {
          code: args.code,
          fromEmail: args.from_email,
          fromName: args.from_name,
          subject: args.subject,
          text: args.text,
        })
        return text(formatTemplate(updated))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_template",
    "Delete a template. Destructive and permanent.",
    { name: z.string().describe("Template name") },
    async ({ name }) => {
      try {
        return text(await deleteTemplate(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "render_template",
    "Render a template with merge vars without sending anything.",
    {
      template_name: z.string().describe("Template name"),
      template_content: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Handlebars replacements: [{name, content}]"),
      merge_vars: z
        .array(z.record(z.unknown()))
        .optional()
        .describe("Merge vars: [{name, content}]"),
    },
    async (args) => {
      try {
        return text(await renderTemplate(args.template_name, args.template_content ?? [], args.merge_vars ?? []))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "publish_template",
    "Publish a template so it can be sent by name.",
    {
      name: z.string().describe("Template name"),
      code: z.string().optional().describe("Optional code to publish with it"),
    },
    async ({ name, code }) => {
      try {
        return text(formatTemplate(await publishTemplate(name, code)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // ---------------------------------------------------------------- users

  server.tool("ping", "Check that the API key works. Returns PONG when it does.", {}, async () => {
    try {
      return text(await mandrillPing())
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("get_user_info", "Read the account's reputation and sending quota.", {}, async () => {
    try {
      const info = await getUserInfo()
      const lines = [
        `User: ${info.username ?? "(unknown)"}`,
        `Email: ${info.email ?? "(unknown)"}`,
        `Reputation: ${info.reputation ?? 0}`,
        `Hourly quota: ${info.hourlyQuota ?? 0}`,
        `Backlog: ${info.backlog ?? 0}`,
      ]
      return text(lines.join("\n"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_senders", "List the domains and addresses this account has sent from.", {}, async () => {
    try {
      return text(formatRows(await listSenders(), "No senders recorded yet."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  // ----------------------------------------------------------------- tags

  server.tool("list_tags", "List tags with their send, open and click totals.", {}, async () => {
    try {
      const tags = await listTags()
      if (tags.length === 0) return text("No tags in this account.")
      return text(`Tags (${tags.length}):\n\n` + tags.map((t, i) => formatTag(t, i)).join("\n"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "delete_tag",
    "Delete a tag and its reporting history. Destructive.",
    { tag: z.string().describe("Tag name") },
    async ({ tag }) => {
      try {
        return text(await deleteTag(tag))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // -------------------------------------------------------------- rejects

  server.tool(
    "list_rejects",
    "List addresses Mandrill has rejected, with the reason.",
    { include_expired: z.boolean().optional().describe("Include expired rejections") },
    async ({ include_expired }) => {
      try {
        const rejects = await listRejects(include_expired ?? false)
        if (rejects.length === 0) return text("The rejection list is empty.")
        return text(`Rejects (${rejects.length}):\n\n` + rejects.map((r, i) => formatReject(r, i)).join("\n\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_reject",
    "Remove one address from the rejection list so it can be mailed again.",
    { email: z.string().describe("Address to unblock") },
    async ({ email }) => {
      try {
        return text(await deleteReject(email))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // ------------------------------------------------------------- webhooks

  server.tool("list_webhooks", "List webhook targets and their delivery counters.", {}, async () => {
    try {
      const hooks = await listWebhooks()
      if (hooks.length === 0) return text("No webhooks configured.")
      return text(`Webhooks (${hooks.length}):\n\n` + hooks.map((w, i) => formatWebhook(w, i)).join("\n\n"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "add_webhook",
    "Create a webhook that posts Mandrill events to a URL.",
    {
      url: z.string().describe("HTTPS endpoint to receive events"),
      description: z.string().optional().describe("Human label"),
      events: z.array(z.string()).optional().describe("Event names, e.g. ['send', 'open', 'hard_bounce']"),
    },
    async ({ url, description, events }) => {
      try {
        return text(formatWebhook(await addWebhook(url, description, events ?? [])))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_webhook",
    "Delete a webhook. Destructive: events stop being delivered.",
    { id: z.number().int().describe("Webhook id") },
    async ({ id }) => {
      try {
        return text(await deleteWebhook(id))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // -------------------------------------------------------------- inbound

  server.tool("list_inbound_domains", "List domains configured to receive inbound mail.", {}, async () => {
    try {
      const domains = await listInboundDomains()
      if (domains.length === 0) return text("No inbound domains configured.")
      return text(
        domains
          .map((d, i) => `${i + 1}. ${d.domain}${d.valid_mx ? " (MX ok)" : " (MX not verified)"}`)
          .join("\n")
      )
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "list_inbound_routes",
    "List inbound routing rules, optionally for one domain.",
    { domain: z.string().optional().describe("Limit to this domain") },
    async ({ domain }) => {
      try {
        return text(formatRows(await listInboundRoutes(domain), "No inbound routes configured."))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "add_inbound_domain",
    "Register a domain for inbound mail processing.",
    { domain: z.string().describe("Domain to receive mail for") },
    async ({ domain }) => {
      try {
        const added = await addInboundDomain(domain)
        return text(`Added inbound domain ${added.domain}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // ---------------------------------------------------------- subaccounts

  server.tool("list_subaccounts", "List subaccounts with reputation and status.", {}, async () => {
    try {
      const subs = await listSubaccounts()
      if (subs.length === 0) return text("No subaccounts.")
      return text(`Subaccounts (${subs.length}):\n\n` + subs.map((s, i) => formatSubaccount(s, i)).join("\n"))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool(
    "add_subaccount",
    "Create a subaccount for separate sending reputation.",
    {
      id: z.string().describe("Unique subaccount id"),
      name: z.string().optional().describe("Display name"),
      notes: z.string().optional().describe("Free-form notes"),
    },
    async ({ id, name, notes }) => {
      try {
        return text(formatSubaccount(await addSubaccount(id, name, notes)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  // ------------------------------------------------------------ reporting

  server.tool("list_urls", "List tracked URLs and their click totals.", {}, async () => {
    try {
      return text(formatRows(await listUrls(), "No tracked URLs yet."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_exports", "List activity export jobs.", {}, async () => {
    try {
      return text(formatRows(await listExports(), "No exports created yet."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  server.tool("list_metadata", "List custom metadata fields defined on the account.", {}, async () => {
    try {
      return text(formatRows(await listMetadata(), "No custom metadata fields."))
    } catch (e) {
      return fail(errorMessage(e))
    }
  })

  return server
}

/** Drop undefined values so Mandrill sees only the fields the caller set. */
function stripUndefined(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) out[key] = value
  }
  return out
}

function errorMessage(e: unknown): string {
  if (e instanceof MandrillError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
