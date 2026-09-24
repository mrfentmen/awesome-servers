// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const WRITE = { readOnlyHint: false, openWorldHint: true } as const

const TWILIO_API = "https://api.twilio.com/2010-04-01"

interface TwilioCredentials {
  accountSid: string
  authToken: string
}

function getCredentials(): TwilioCredentials {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required")
  }

  return { accountSid, authToken }
}

function twilioUrl(path: string): string {
  const { accountSid } = getCredentials()
  return `${TWILIO_API}/Accounts/${accountSid}${path}`
}

async function twilioRequest(path: string, params: Record<string, string> = {}, method = "GET"): Promise<any> {
  const { accountSid, authToken } = getCredentials()
  const url = twilioUrl(path)

  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
  }

  if (method === "POST") {
    const body = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      body.set(key, value)
    }
    options.headers = {
      ...options.headers,
      "Content-Type": "application/x-www-form-urlencoded",
    }
    options.body = body.toString()
  } else {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value)
    }
    const separator = url.includes("?") ? "&" : "?"
    return fetch(`${url}${separator}${searchParams.toString()}`, options).then((r) => r.json())
  }

  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Twilio API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function handleSendSMS(to: string, from: string, body: string) {
  const data = await twilioRequest("/Messages.json", { To: to, From: from, Body: body }, "POST")
  return JSON.stringify({ sid: data.sid, status: data.status, to: data.to, from: data.from }, null, 2)
}

async function handleSendMMS(to: string, from: string, body: string, mediaUrl: string) {
  const data = await twilioRequest("/Messages.json", { To: to, From: from, Body: body, MediaUrl: mediaUrl }, "POST")
  return JSON.stringify({ sid: data.sid, status: data.status, to: data.to, from: data.from }, null, 2)
}

async function handleSendWhatsApp(to: string, from: string, body: string) {
  const data = await twilioRequest(
    "/Messages.json",
    {
      To: `whatsapp:${to}`,
      From: `whatsapp:${from}`,
      Body: body,
    },
    "POST",
  )
  return JSON.stringify({ sid: data.sid, status: data.status }, null, 2)
}

async function handleMessageStatus(messageSid: string) {
  const data = await twilioRequest(`/Messages/${messageSid}.json`)
  return JSON.stringify(
    { sid: data.sid, status: data.status, error_code: data.error_code, error_message: data.error_message },
    null,
    2,
  )
}

async function handleListMessages(limit: number, to?: string, from?: string) {
  const params: Record<string, string> = { PageSize: String(limit) }
  if (to) params.To = to
  if (from) params.From = from
  const data = await twilioRequest("/Messages.json", params)
  const messages = (data.messages || []).map((m: any) => ({
    sid: m.sid,
    to: m.to,
    from: m.from,
    status: m.status,
    date_sent: m.date_sent,
    body: m.body?.slice(0, 100),
  }))
  return JSON.stringify(messages, null, 2)
}

async function handleMakeCall(to: string, from: string, url: string) {
  const data = await twilioRequest("/Calls.json", { To: to, From: from, Url: url }, "POST")
  return JSON.stringify({ sid: data.sid, status: data.status, to: data.to, from: data.from }, null, 2)
}

async function handleListCalls(limit: number) {
  const data = await twilioRequest("/Calls.json", { PageSize: String(limit) })
  const calls = (data.calls || []).map((c: any) => ({
    sid: c.sid,
    to: c.to,
    from: c.from,
    status: c.status,
    duration: c.duration,
    date_created: c.date_created,
  }))
  return JSON.stringify(calls, null, 2)
}

async function handleListNumbers(limit: number) {
  const data = await twilioRequest("/IncomingPhoneNumbers.json", { PageSize: String(limit) })
  const numbers = (data.incoming_phone_numbers || []).map((n: any) => ({
    phone_number: n.phone_number,
    friendly_name: n.friendly_name,
    sid: n.sid,
    capabilities: n.capabilities,
  }))
  return JSON.stringify(numbers, null, 2)
}

async function handleSearchNumbers(areaCode: string, limit: number) {
  const data = await twilioRequest("/AvailablePhoneNumbers/US/Mobile.json", {
    AreaCode: areaCode,
    PageSize: String(limit),
  })
  const numbers = (data.available_phone_numbers || []).map((n: any) => ({
    phone_number: n.phone_number,
    friendly_name: n.friendly_name,
    capabilities: n.capabilities,
  }))
  return JSON.stringify(numbers, null, 2)
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "twilio-mcp", version: "1.0.0" })

  server.registerTool(
    "send_sms",
    {
      title: "Send sms",
      description: "Send an SMS text message to a phone number.",
      inputSchema: z.object(
    {
      to: z.string().describe("Destination phone number in E.164 format (e.g. +1234567890)"),
      from: z.string().describe("Your Twilio phone number in E.164 format"),
      body: z.string().describe("Message text to send"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const text = await handleSendSMS(args.to, args.from, args.body)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "send_mms",
    {
      title: "Send mms",
      description: "Send an MMS message with an image or media attachment.",
      inputSchema: z.object(
    {
      to: z.string().describe("Destination phone number"),
      from: z.string().describe("Your Twilio phone number"),
      body: z.string().describe("Message text"),
      media_url: z.string().describe("URL of the media file to attach"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const text = await handleSendMMS(args.to, args.from, args.body, args.media_url)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "send_whatsapp",
    {
      title: "Send whatsapp",
      description: "Send a WhatsApp message using Twilio.",
      inputSchema: z.object(
    {
      to: z.string().describe("Recipient WhatsApp number (e.g. +1234567890)"),
      from: z.string().describe("Your Twilio WhatsApp number"),
      body: z.string().describe("Message text"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const text = await handleSendWhatsApp(args.to, args.from, args.body)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_message_status",
    {
      title: "Get message status",
      description: "Check the delivery status of a sent message.",
      inputSchema: z.object(
    { message_sid: z.string().describe("The message SID from a send operation") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleMessageStatus(args.message_sid)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_messages",
    {
      title: "List messages",
      description: "List recent messages with optional filters.",
      inputSchema: z.object(
    {
      limit: z.number().min(1).max(100).optional().describe("Max messages to return"),
      to: z.string().optional().describe("Filter by destination number"),
      from: z.string().optional().describe("Filter by source number"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleListMessages(args.limit ?? 20, args.to, args.from)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "make_call",
    {
      title: "Make call",
      description: "Initiate a voice call. Requires a TwiML URL for call handling.",
      inputSchema: z.object(
    {
      to: z.string().describe("Destination phone number"),
      from: z.string().describe("Your Twilio phone number"),
      url: z.string().describe("TwiML URL that controls the call flow"),
    }),
      annotations: WRITE,
    },
    async (args: any) => {
      try {
        const text = await handleMakeCall(args.to, args.from, args.url)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_calls",
    {
      title: "List calls",
      description: "List recent voice calls.",
      inputSchema: z.object(
    { limit: z.number().min(1).max(100).optional().describe("Max calls to return") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleListCalls(args.limit ?? 20)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_numbers",
    {
      title: "List numbers",
      description: "List your Twilio phone numbers.",
      inputSchema: z.object(
    { limit: z.number().min(1).max(100).optional().describe("Max numbers to return") }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleListNumbers(args.limit ?? 20)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "search_numbers",
    {
      title: "Search numbers",
      description: "Search available phone numbers for purchase by area code.",
      inputSchema: z.object(
    {
      area_code: z.string().describe("US area code to search (e.g. 415)"),
      limit: z.number().min(1).max(50).optional().describe("Max results"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleSearchNumbers(args.area_code, args.limit ?? 10)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  return server
}
