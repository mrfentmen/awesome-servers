// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const MIXPANEL_API = "https://mixpanel.com/api/2.0"
const MIXPANEL_EXPORT = "https://data.mixpanel.com/api/2.0"

interface MixpanelCredentials {
  serviceAccount: string
  serviceSecret: string
  projectId: string
  apiSecret?: string
}

function getCredentials(): MixpanelCredentials {
  const serviceAccount = process.env.MIXPANEL_SERVICE_ACCOUNT
  const serviceSecret = process.env.MIXPANEL_SERVICE_SECRET
  const projectId = process.env.MIXPANEL_PROJECT_ID
  const apiSecret = process.env.MIXPANEL_API_SECRET

  if (!serviceAccount || !serviceSecret) {
    throw new Error("MIXPANEL_SERVICE_ACCOUNT and MIXPANEL_SERVICE_SECRET environment variables are required")
  }

  return { serviceAccount, serviceSecret, projectId: projectId || "", apiSecret }
}

async function mixpanelFetch(path: string, params: Record<string, string> = {}, useExport = false): Promise<any> {
  const creds = getCredentials()
  const base = useExport ? MIXPANEL_EXPORT : MIXPANEL_API
  const url = new URL(`${base}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const auth = Buffer.from(`${creds.serviceAccount}:${creds.serviceSecret}`).toString("base64")
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mixpanel API error ${res.status}: ${body}`)
  }

  return res.json()
}

async function handleEvents(
  event: string | undefined,
  fromDate: string,
  toDate: string,
  unit: string,
  interval: number,
  limit: number,
) {
  const params: Record<string, string> = {
    from_date: fromDate,
    to_date: toDate,
    unit: unit,
    interval: String(interval),
    limit: String(limit),
  }
  if (event) params.event = event

  const data = await mixpanelFetch("/events/properties/top", params)
  return JSON.stringify(data, null, 2)
}

async function handleTopEvents(fromDate: string, toDate: string, limit: number) {
  const data = await mixpanelFetch("/events/top", {
    from_date: fromDate,
    to_date: toDate,
    limit: String(limit),
  })
  return JSON.stringify(data, null, 2)
}

async function handleFunnel(funnelId: string, fromDate: string, toDate: string) {
  const data = await mixpanelFetch(`/funnels/${funnelId}`, {
    from_date: fromDate,
    to_date: toDate,
  })
  return JSON.stringify(data, null, 2)
}

async function handleRetention(fromDate: string, toDate: string, bornEvent: string, limit: number) {
  const params: Record<string, string> = {
    from_date: fromDate,
    to_date: toDate,
    limit: String(limit),
  }
  if (bornEvent) params.born_event = bornEvent

  const data = await mixpanelFetch("/retention", params)
  return JSON.stringify(data, null, 2)
}

async function handleProfiles(search: string, limit: number) {
  const data = await mixpanelExportRequest(
    [
      {
        event: "$properties",
        values: ["$distinct_id"],
      },
    ],
    { search },
    limit,
  )
  return JSON.stringify(data, null, 2)
}

async function mixpanelExportRequest(columns: any[], filter: Record<string, string>, limit: number): Promise<any> {
  const creds = getCredentials()
  const url = new URL(`${MIXPANEL_EXPORT}/engage`)

  const body = {
    output_properties: columns,
    ...filter,
    limit,
  }

  const auth = Buffer.from(`${creds.serviceAccount}:${creds.serviceSecret}`).toString("base64")
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Mixpanel export error ${res.status}: ${text}`)
  }

  return res.json()
}

async function handleJQL(script: string) {
  const creds = getCredentials()
  const url = new URL(`${MIXPANEL_API}/jql`)

  const auth = Buffer.from(`${creds.serviceAccount}:${creds.serviceSecret}`).toString("base64")
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ script }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`JQL error ${res.status}: ${text}`)
  }

  return res.text()
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "mixpanel-mcp", version: "1.0.0" })

  server.registerTool(
    "query_events",
    {
      title: "Query events",
      description: "Query raw event data from Mixpanel. Segment events by time range and properties.",
      inputSchema: z.object(
    {
      event: z.string().optional().describe("Specific event name to query. Omit for all events."),
      from_date: z.string().describe("Start date in YYYY-MM-DD format"),
      to_date: z.string().describe("End date in YYYY-MM-DD format"),
      unit: z.enum(["hour", "day", "week", "month"]).optional().describe("Time granularity"),
      interval: z.number().min(1).max(365).optional().describe("Number of time units to return"),
      limit: z.number().min(1).max(1000).optional().describe("Max results"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleEvents(
          args.event,
          args.from_date,
          args.to_date,
          args.unit ?? "day",
          args.interval ?? 30,
          args.limit ?? 100,
        )
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_top_events",
    {
      title: "Get top events",
      description: "Get the most frequently tracked events in a time window.",
      inputSchema: z.object(
    {
      from_date: z.string().describe("Start date YYYY-MM-DD"),
      to_date: z.string().describe("End date YYYY-MM-DD"),
      limit: z.number().min(1).max(100).optional().describe("Number of top events to return"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleTopEvents(args.from_date, args.to_date, args.limit ?? 20)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_funnel",
    {
      title: "Get funnel",
      description: "Get funnel conversion data. Requires a funnel ID from your Mixpanel project.",
      inputSchema: z.object(
    {
      funnel_id: z.string().describe("The funnel ID from Mixpanel"),
      from_date: z.string().describe("Start date YYYY-MM-DD"),
      to_date: z.string().describe("End date YYYY-MM-DD"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleFunnel(args.funnel_id, args.from_date, args.to_date)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "get_retention",
    {
      title: "Get retention",
      description: "Get cohort retention data. See how many users come back over time.",
      inputSchema: z.object(
    {
      from_date: z.string().describe("Start date YYYY-MM-DD"),
      to_date: z.string().describe("End date YYYY-MM-DD"),
      born_event: z.string().optional().describe("Event that defines the cohort (e.g. 'Sign Up')"),
      limit: z.number().min(1).max(100).optional().describe("Number of cohorts to return"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleRetention(args.from_date, args.to_date, args.born_event ?? "", args.limit ?? 10)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "query_profiles",
    {
      title: "Query profiles",
      description: "Search and query user profiles in Mixpanel.",
      inputSchema: z.object(
    {
      search: z.string().describe("Search term for user profiles (email, name, or property value)"),
      limit: z.number().min(1).max(1000).optional().describe("Max profiles to return"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleProfiles(args.search, args.limit ?? 20)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "run_jql",
    {
      title: "Run jql",
      description: "Execute a raw JavaScript Query Language (JQL) script against Mixpanel. For advanced custom queries.",
      inputSchema: z.object(
    {
      script: z.string().describe("JQL JavaScript code to execute"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const text = await handleJQL(args.script)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  server.registerTool(
    "list_events",
    {
      title: "List events",
      description: "List all tracked event names in your Mixpanel project.",
      inputSchema: z.object(
    {
      from_date: z.string().describe("Start date YYYY-MM-DD"),
      to_date: z.string().describe("End date YYYY-MM-DD"),
    }),
      annotations: READ_ONLY,
    },
    async (args: any) => {
      try {
        const data = await mixpanelFetch("/events/names", {
          from_date: args.from_date,
          to_date: args.to_date,
        })
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] , isError: true }
      }
    }
  )

  return server
}
