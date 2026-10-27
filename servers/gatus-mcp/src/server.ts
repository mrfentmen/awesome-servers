import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { checkEndpoint, dnsRecords, endpointLatency, errorMessage, healthRollup, securityHeaders, tlsExpiry, payloadReport, allowedMethods, healthPathProbe } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({ name: "gatus-mcp", version: "1.0.0" })

  server.registerTool(
    "check_endpoint",
    {
      title: "Check endpoint",
      description: "Judge one endpoint against the conditions a health dashboard uses: status it must return, a latency budget and text its body must contain.",
      inputSchema: z.object({
        url: z.string().describe("Endpoint to check, for example https://api.example.com/health."),
        expectedStatus: z.number().describe("HTTP status the endpoint must return. Defaults to 200.").optional(),
        maxMs: z.number().describe("Latency budget in milliseconds, for example 500.").optional(),
        bodyContains: z.string().describe("Text the response body must contain, for example ok.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await checkEndpoint(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "health_rollup",
    {
      title: "Health rollup",
      description: "Check up to 10 endpoints against the same conditions and report the pass rate and median latency across them.",
      inputSchema: z.object({
        urls: z.array(z.string()).describe("Up to 10 endpoints to roll up, for example ['https://api.example.com', 'https://example.com']."),
        expectedStatus: z.number().describe("HTTP status every endpoint must return. Defaults to 200.").optional(),
        maxMs: z.number().describe("Latency budget in milliseconds that every endpoint must stay inside.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await healthRollup(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "endpoint_latency",
    {
      title: "Endpoint latency",
      description: "Sample an endpoint several times and report fastest, median, average, slowest and how much the timings spread.",
      inputSchema: z.object({
        url: z.string().describe("Endpoint to sample, for example https://example.com."),
        samples: z.number().describe("Requests to make, 2-10. Defaults to 3.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await endpointLatency(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "tls_expiry",
    {
      title: "TLS expiry",
      description: "Days left on a host's TLS certificate, who issued it and whether the chain is trusted.",
      inputSchema: z.object({
        host: z.string().describe("Hostname to read the certificate from, for example example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await tlsExpiry(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "dns_records",
    {
      title: "DNS records",
      description: "A, AAAA, NS, MX, TXT and CAA records for a domain, or just one type if you name it.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to look up, for example example.com."),
        type: z.string().describe("One record type: A, AAAA, NS, MX, TXT or CAA. Omit to fetch all of them.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await dnsRecords(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "security_headers",
    {
      title: "Security headers",
      description: "Grade the response security headers a site sends: HSTS, CSP, frame options, content type options, referrer and permissions policy.",
      inputSchema: z.object({
        url: z.string().describe("URL to grade, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await securityHeaders(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "payload_report",
    {
      title: "Payload report",
      description: "How much a page actually transfers: bytes, compression, content type, cache headers, and what to fix for page weight.",
      inputSchema: z.object({
        url: z.string().describe("URL to measure, for example https://example.com.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await payloadReport(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "allowed_methods",
    {
      title: "Allowed methods",
      description: "Which HTTP methods an endpoint answers: OPTIONS with its Allow header, plus whether HEAD and GET work.",
      inputSchema: z.object({
        url: z.string().describe("Endpoint to probe, for example https://api.example.com/health.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await allowedMethods(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "health_path_probe",
    {
      title: "Health path probe",
      description: "Probe the usual health endpoints (/health, /healthz, /status, /ready, /livez...) and report which one answers.",
      inputSchema: z.object({
        host: z.string().describe("Host or URL to probe, for example https://api.example.com."),
        paths: z.string().describe("Comma-separated paths to try instead of the default eight.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await healthPathProbe(args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  return server
}
