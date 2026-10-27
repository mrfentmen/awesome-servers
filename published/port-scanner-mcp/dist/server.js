import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { scanCommon, scanHost } from "./scan.js";
import { parsePortSpec, dnsRecords } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "port-scanner-mcp", version: "1.0.0" });
    server.registerTool("scan_host", {
        title: "Scan host",
        description: "Scan a host for open ports.",
        inputSchema: z.object({ host: z.string().describe("Host name or IP."), ports: z.string().describe("Comma separated port list.").optional(), timeout_ms: z.number().describe("Per port timeout in milliseconds.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await scanHost(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("scan_common", {
        title: "Scan common",
        description: "Scan a host against common ports.",
        inputSchema: z.object({ host: z.string().describe("Host name or IP.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await scanCommon(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("summarize_scan_results", {
        title: "Summarize scan results",
        description: "Summarise a scan report you paste back in: state counts, open ratio, open ports as contiguous runs, highest open port, longest run, isolated opens and probed coverage. Computed locally from the text you supply; no connection is attempted.",
        inputSchema: z.object({ report: z.string().min(1).max(200000).describe("Scan output to summarise, for example \"80: OPEN\" lines, up to 200,000 characters.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement results locally (paywall removed)
        try {
            return textError("Not yet implemented: results");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("parse_port_spec", {
        title: "Parse port spec",
        description: "Expand a port specification you supply into a deduplicated sorted list: contiguous runs, duplicates collapsed, backwards and out-of-range entries rejected with a reason, and the port count the specification implies. No connection is attempted.",
        inputSchema: z.object({ spec: z.string().min(1).max(20000).describe("Port specification such as 22,80,8000-8010, up to 20,000 characters."), max_ports: z.number().int().min(1).max(4096).optional().describe("Reject any single range wider than this many ports, 1-4096.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await parsePortSpec(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dns_records", {
        title: "DNS records",
        description: "Query Google Public DNS for address, mail, nameserver and other DNS records with TTL and response status.",
        inputSchema: z.object({ name: z.string().min(1).max(253).describe("DNS name, e.g. example.com."), type: z.enum(["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA", "PTR", "CAA"]).optional(), limit: z.number().int().min(1).max(30).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dnsRecords(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_origin", {
        title: "Network origin",
        description: "Find the containing IP prefix and originating autonomous system numbers from RIPEstat routing data.",
        inputSchema: z.object({ ip: z.string().min(1).max(45).describe("IPv4 or IPv6 address, e.g. 1.1.1.1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement origin locally (paywall removed)
        try {
            return textError("Not yet implemented: origin");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "port-scanner-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    return server;
}
