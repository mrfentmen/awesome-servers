import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorMessage, getStatus, listServices, listRoutes, corsPreflight, edgeHeaders } from "./api.js";
import { premiumRequired } from "./license.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "kong-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_status", {
        title: "Gateway status",
        description: "Kong status counters: database and connections.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getStatus());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_services", {
        title: "List services",
        description: "Services configured in Kong, with hosts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listServices());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("list_routes", {
        title: "List routes",
        description: "Routes configured in Kong, with paths.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await listRoutes());
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("cors_preflight", {
        title: "CORS preflight",
        description: "Send a real CORS preflight to a gateway's public edge and report exactly what it allows: origin, methods, headers, credentials and max-age, plus a verdict. No Kong admin key needed.",
        inputSchema: z.object({ url: z.string().describe("Public base URL of the gateway, e.g. https://api.example.com"), origin: z.string().describe("Origin to ask about, e.g. https://app.example.com"), method: z.string().describe("Method to ask about (default GET).").optional(), headers: z.array(z.string()).describe("Headers to ask about, e.g. [\"content-type\",\"authorization\"].").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: cors_preflight ----
        const paywallMessage = await premiumRequired("cors_preflight");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await corsPreflight(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("edge_headers", {
        title: "Edge headers",
        description: "What a gateway's public edge discloses: server and cache signatures, its own latency or request-id headers, the security headers it sets and the ones it omits. No Kong admin key needed.",
        inputSchema: z.object({ url: z.string().describe("Public base URL of the gateway"), method: z.string().describe("GET, HEAD or OPTIONS (default GET).").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: edge_headers ----
        const paywallMessage = await premiumRequired("edge_headers");
        if (paywallMessage)
            return { content: [{ type: "text", text: paywallMessage }], isError: true };
        // ---- paywall: end ----
        try {
            return text(await edgeHeaders(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
