import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { errorMessage, listDomains, getDomain, getEmail, listApiKeys, listAudiences, getAudience, listContacts, listBroadcasts, getBroadcast, createContact, addDomain, buildMimeMessage, dkimCanonicalization } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const MUTATING = { readOnlyHint: false, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "resend-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_domains",
    {
      title: "List domains",
      description: "Domains verified for sending, with DKIM status.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDomains());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_domain",
    {
      title: "Get domain",
      description: "One sending domain by id, with DNS records.",
      inputSchema: z.object({
        domain_id: z.string().describe("Domain UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ domain_id }) => {
      try {
        return text(await getDomain(domain_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_email",
    {
      title: "Get email",
      description: "One sent email by id, with delivery status.",
      inputSchema: z.object({
        email_id: z.string().describe("Email ID from the send response")
      }),
      annotations: READ_ONLY,
    },
    async ({ email_id }) => {
      try {
        return text(await getEmail(email_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_api_keys",
    {
      title: "API keys",
      description: "Key list.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listApiKeys());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_audiences",
    {
      title: "Audiences",
      description: "Contact audiences.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listAudiences());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_audience",
    {
      title: "Get audience",
      description: "Audience details.",
      inputSchema: z.object({
        audience_id: z.string().describe("Audience UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ audience_id }) => {
      try {
        return text(await getAudience(audience_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_contacts",
    {
      title: "Audience contacts",
      description: "Contacts in audience.",
      inputSchema: z.object({
        audience_id: z.string().describe("Audience UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ audience_id }) => {
      try {
        return text(await listContacts(audience_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "list_broadcasts",
    {
      title: "Broadcasts",
      description: "Email broadcasts.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listBroadcasts());
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "get_broadcast",
    {
      title: "Get broadcast",
      description: "Broadcast details.",
      inputSchema: z.object({
        broadcast_id: z.string().describe("Broadcast UUID.")
      }),
      annotations: READ_ONLY,
    },
    async ({ broadcast_id }) => {
      try {
        return text(await getBroadcast(broadcast_id));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "create_contact",
    {
      title: "Add contact",
      description: "Add a REAL contact.",
      inputSchema: z.object({
        audience_id: z.string().describe("Audience UUID."),
        email: z.string().describe("Email.")
      }),
      annotations: MUTATING,
    },
    async ({ audience_id, email }) => {
      try {
        return text(await createContact(audience_id, email));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "add_domain",
    {
      title: "Add domain",
      description: "Add a REAL sending domain.",
      inputSchema: z.object({
        name: z.string().describe("Domain name.")
      }),
      annotations: MUTATING,
    },
    async ({ name }) => {
      try {
        return text(await addDomain(name));
      } catch (e) {
        return textError(String(e));
      }
    }
  )

  server.registerTool(
    "build_mime_message",
    {
      title: "Build a MIME message",
      description:
        "Assemble the MIME message a multipart email actually is, with base64 parts and CRLF line endings, and report its exact octet count, its boundary, the encoding of each part and the provider limits it sits against.",
      inputSchema: z.object({
        from: z.string().describe("From address, e.g. 'hello@example.com'"),
        to: z.string().describe("To address, e.g. 'reader@example.org'"),
        subject: z.string().describe("Subject line"),
        text: z.string().describe("Plain-text part. Required unless html is given.").optional(),
        html: z.string().describe("HTML part. Supplying it makes the message multipart/alternative.").optional(),
        reply_to: z.string().describe("Reply-To address.").optional(),
        message_id: z.string().describe("Message-ID header value, if you need it fixed.").optional(),
        date: z.string().describe("Date header, as an RFC 5322 string. Defaults to now.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await buildMimeMessage(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "dkim_canonicalisation",
    {
      title: "DKIM canonicalisation",
      description:
        "Exactly what a DKIM signer will hash: the simple and relaxed canonical forms of the body and of the signed header block, with the bh= and h= SHA-256 values, and where the two forms diverge.",
      inputSchema: z.object({
        headers: z.array(z.string()).describe("The header block that would be signed, one header per line, in signing order"),
        body: z.string().describe("The message body, after any transfer encoding"),
        hash: z.string().describe("sha1 or sha256. Defaults to sha256.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dkimCanonicalization(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}