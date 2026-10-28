import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkHeaders, checkRedirects, checkUrl, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "http-check-mcp", version: "1.0.0" });
    server.tool("check_url", "Fetch a URL and report status, final URL, timing and key headers.", {
        url: z.string().describe('Public http(s) URL'), method: z.enum(['GET', 'HEAD', 'POST']).optional().describe('Request method, default GET')
    }, async (a) => {
        try {
            return text(await checkUrl(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("check_redirects", "Walk a URL redirect chain hop by hop without following automatically.", {
        url: z.string().describe('Public http(s) URL'), maxHops: z.number().int().min(1).max(10).optional().describe('Hops to follow, default 5')
    }, async (a) => {
        try {
            return text(await checkRedirects(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("check_headers", "List which security headers a site sends and which are missing.", {
        url: z.string().describe('Public http(s) URL')
    }, async (a) => {
        try {
            return text(await checkHeaders(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
