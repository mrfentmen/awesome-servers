import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { auditEndpoint, auditTools, checkListing, compareServers, diffToolSchema, errorMessage, generateToolRegistration, lintSource, probeKeyless, registryLookup, npmPackageCheck, callTool, serverJsonCheck, openapiSpecAudit, endpointLatencyMatrix } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({ name: "mcp-auditor-mcp", version: "1.0.0" });
    server.registerTool("probe_keyless", {
        title: "Probe keyless",
        description: "Ask an API whether it answers with no credentials, and report its status, response shape and rate-limit headers.",
        inputSchema: z.object({
            url: z.string().describe("API URL to probe, for example https://api.example.com/v1/items."),
            method: z.string().describe("GET, HEAD or POST. Defaults to GET.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await probeKeyless(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("audit_endpoint", {
        title: "Audit endpoint",
        description: "Handshake with a public MCP endpoint, read its tool list and report tool count, naming, descriptions, annotations and parameter gaps.",
        inputSchema: z.object({
            url: z.string().describe("MCP endpoint URL, for example https://example.com/mcp.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auditEndpoint(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("audit_tools", {
        title: "Audit tool list",
        description: "Same audit as audit_endpoint, but run on a tools/list payload you paste in. Use it for endpoints behind credentials or a draft before deploy.",
        inputSchema: z.object({
            tools: z.string().describe('The tools/list JSON: {"tools": [...]}, the whole JSON-RPC reply, or a bare array.'),
            label: z.string().describe("Name to show in the report, for example weather-mcp draft.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await auditTools(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("compare_servers", {
        title: "Compare servers",
        description: "Measure how much two MCP servers overlap, so near-duplicate servers are obvious before they compete. Each side is an endpoint URL or a pasted tools/list payload.",
        inputSchema: z.object({
            a: z.string().describe("First side: an MCP endpoint URL, or a tools/list JSON payload."),
            b: z.string().describe("Second side: an MCP endpoint URL, or a tools/list JSON payload.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await compareServers(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("check_listing", {
        title: "Check listing",
        description: "Validate Store copy against the real limits and the real category list, so a push cannot fail on a field length or a made-up category.",
        inputSchema: z.object({
            title: z.string().describe("Store title, limit 63 characters."),
            seoTitle: z.string().describe("SEO title, limit 60 characters."),
            seoDescription: z.string().describe("SEO description, limit 160 characters."),
            description: z.string().describe("Store description, limit 300 characters."),
            categories: z.array(z.string()).describe("Up to 3 categories, for example ['DEVELOPER_TOOLS', 'MCP_SERVERS', 'AI'].")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await checkListing(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("lint_source", {
        title: "Lint source",
        description: "Lint pasted MCP server TypeScript: tool count, duplicate names, tool and parameter descriptions, annotations, missing try/catch, fetch calls with no timeout, type suppressions, placeholders and dead code.",
        inputSchema: z.object({
            source: z.string().describe("The whole TypeScript file to lint."),
            label: z.string().describe("Name to show in the report, for example weather-mcp/src/server.ts.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lintSource(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("generate_tool_registration", {
        title: "Generate tool registration",
        description: "Turn a tool spec into a complete server.ts in house style: imports, registerTool blocks, zod schemas and try/catch, ready to paste.",
        inputSchema: z.object({
            serverName: z.string().describe("Server name, for example weather-mcp."),
            tools: z.array(z.object({
                name: z.string().describe("Tool name in snake_case, for example search_items."),
                title: z.string().describe("Short human title, for example Search items."),
                description: z.string().describe("What the tool does, in one sentence."),
                params: z.array(z.object({
                    name: z.string().describe("Parameter name."),
                    type: z.string().describe("string, number, boolean or array."),
                    description: z.string().describe("What the parameter means, with a real example value."),
                    optional: z.boolean().describe("True when the caller may omit it.")
                })).describe("Parameters for this tool. Omit for a tool that takes none.").optional()
            })).describe("The tools to register, up to 40.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await generateToolRegistration(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("diff_tool_schema", {
        title: "Diff tool schema",
        description: "Compare two tools/list replies and separate breaking changes from safe additions, so a release cannot silently break callers.",
        inputSchema: z.object({
            before: z.string().describe('The old tools/list JSON, for example {"tools": [...]} or the whole JSON-RPC reply.'),
            after: z.string().describe("The new tools/list JSON, same shape as before.")
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await diffToolSchema(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("registry_lookup", {
        title: "Registry lookup",
        description: "Search the official MCP registry for a server name or keyword and see whether the name is taken, who published it, which versions exist and what transports they use.",
        inputSchema: z.object({
            query: z.string().describe("A server name like io.github.acme/weather-mcp, or a keyword like weather."),
            limit: z.number().describe("How many registry rows to fetch, 1-50. Defaults to 20.").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            return text(await registryLookup({ query, limit }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("npm_package_check", {
        title: "Check npm package",
        description: "Check an npm package before a registry submission: is the name free, how old is the last release, how many downloads, and does the manifest carry mcpName, a bin, keywords and a license.",
        inputSchema: z.object({
            name: z.string().describe("npm package name, for example @acme/weather-mcp or weather-mcp."),
        }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            return text(await npmPackageCheck({ name }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("call_tool", {
        title: "Call a tool",
        description: "Handshake with a public MCP endpoint, confirm the tool is in its list, then actually call it and report the latency, the content blocks and whether it returned a tool-level error.",
        inputSchema: z.object({
            url: z.string().describe("MCP endpoint URL, for example https://example.com/mcp."),
            tool: z.string().describe("Tool name to call, exactly as the server lists it."),
            args: z.string().describe('Tool arguments as a JSON object, for example {"city": "Berlin"}. Omit for a tool that takes none.').optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ url, tool, args }) => {
        try {
            return text(await callTool({ url, tool, args }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("server_json_check", {
        title: "Check server.json",
        description: "Validate a server.json against the rules the official registry enforces: name shape and namespace, description length, semver, repository, packages or remotes, transports, and secret environment variables.",
        inputSchema: z.object({
            serverJson: z.string().describe("The contents of server.json, pasted as text."),
        }),
        annotations: READ_ONLY,
    }, async ({ serverJson }) => {
        try {
            return text(await serverJsonCheck({ serverJson }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("openapi_spec_audit", {
        title: "OpenAPI spec audit",
        description: "Fetch a real OpenAPI or Swagger JSON document and audit it: operation count, servers, security schemes, and the quality gaps that matter when each operation is about to become an MCP tool - missing operationIds, missing descriptions, untagged and deprecated operations.",
        inputSchema: z.object({ url: z.string().describe("https:// URL of the OpenAPI or Swagger JSON document."), limit: z.number().int().min(1).max(30).default(12).describe("Operations to print (default 12, max 30).") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: openapi_spec_audit ----
        try {
            return text(await openapiSpecAudit(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("endpoint_latency_matrix", {
        title: "Endpoint latency matrix",
        description: "Probe several candidate endpoints at once and compare them on what a single probe does not report: time to first byte, total round trip, body size, the server header, whether a redirect happened and which URL is simply broken.",
        inputSchema: z.object({ urls: z.string().describe("Up to ten endpoint URLs, separated by spaces or commas."), method: z.string().describe("GET or HEAD (default GET).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: endpoint_latency_matrix ----
        try {
            return text(await endpointLatencyMatrix(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
