import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { decodeJwt, tokenTimeline, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "jwt-mcp", version: "1.0.1" });
    server.tool("decode_jwt", "Decode a JWT and show its header, claims and expiry state.", {
        token: z.string().min(10).describe("The JWT, as issued")
    }, async (a) => {
        try {
            return text(await decodeJwt(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("token_timeline", "Timeline of issued-at, not-before and expiry claims, with time left.", {
        token: z.string().min(10).describe("The JWT, as issued"),
        now: z.string().optional().describe("Reference time as ISO 8601 (defaults to the current time)")
    }, async (a) => {
        try {
            return text(await tokenTimeline(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
