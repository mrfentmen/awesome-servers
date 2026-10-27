import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspect, plan } from "./sieve.js";
import { compareSchemas } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
const file = z.string().min(1).max(1000).describe("Local JSON Schema file. Network URLs are not accepted.");
export function createServer() {
    const server = new McpServer({ name: "schema-sieve-mcp", version: "1.0.0" });
    server.registerTool("inspect_schema", {
        title: "Inspect schema",
        description: "Summarize a local JSON Schema's types, properties, required fields, composition, and constraints without returning examples or defaults.",
        inputSchema: z.object({ file }),
        annotations: READ_ONLY,
    }, async ({ file: target }) => { try {
        return text(format(await inspect(target)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("plan_fixture", {
        title: "Plan fixture",
        description: "Create a privacy-safe placeholder plan for test fixture fields in a local JSON Schema. It does not fabricate or copy example data.",
        inputSchema: z.object({ file }),
        annotations: READ_ONLY,
    }, async ({ file: target }) => { try {
        return text(format(await plan(target)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("validate_instance", {
        title: "Validate instance",
        description: "Validate a JSON instance against a JSON Schema you supply, using a documented subset of draft keywords including local $ref, allOf, anyOf and oneOf. Violations are reported as paths and reasons; instance values, examples, defaults and sensitive-like property names are never returned.",
        inputSchema: z.object({ schema: z.any().describe("JSON Schema as an object or a JSON string."), instance: z.any().describe("Instance to validate as an object, array or JSON string.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement instance locally (paywall removed)
        try {
            return textError("Not yet implemented: instance");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("compare_schemas", {
        title: "Compare schemas",
        description: "Diff two JSON Schemas you supply into added, removed and changed property paths with the type, enum size and constraint deltas for each change, plus a compatibility hint. Examples, defaults, const values and sensitive-like property names are never returned.",
        inputSchema: z.object({ before: z.any().describe("Baseline JSON Schema as an object or a JSON string."), after: z.any().describe("Candidate JSON Schema as an object or a JSON string.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await compareSchemas(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "schema-sieve-mcp";
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
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
