import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { countJsonpath, listJsonPaths, queryJsonpath, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "jsonpath-mcp", version: "1.0.0" });
    server.tool("query_jsonpath", "Run a JSONPath query and return each match.", {
        json: z.string().describe("JSON document as text"),
        path: z.string().describe('JSONPath, e.g. "$.items[*].name" or "$..id"')
    }, async (a) => {
        try {
            return text(await queryJsonpath(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("list_json_paths", "List every leaf path in a JSON document.", {
        json: z.string().describe("JSON document as text"),
        maxDepth: z.number().int().min(1).max(20).default(8).describe("How deep to walk")
    }, async (a) => {
        try {
            return text(await listJsonPaths(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("count_jsonpath", "Count how many nodes a JSONPath expression matches.", {
        json: z.string().describe("JSON document as text"),
        path: z.string().describe("JSONPath expression")
    }, async (a) => {
        try {
            return text(await countJsonpath(a));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
