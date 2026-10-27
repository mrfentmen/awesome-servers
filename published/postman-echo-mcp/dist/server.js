import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { get, ip } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "postman-echo-mcp", version: "1.0.0" });
    server.registerTool("get", {
        title: "Get",
        description: "Echo a GET request.",
        inputSchema: z.object({ params: z.string().describe("Query params as a=b&c=d.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await get(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip", {
        title: "Ip",
        description: "Your outbound IP.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ip(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("status_probe", {
        title: "Status probe",
        description: "Ask Postman Echo for a specific HTTP status code and report what actually came back: status, body and headers.",
        inputSchema: z.object({ code: z.number().describe("HTTP status code to request, 100-599, for example 418."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement probe locally (paywall removed)
        try {
            return textError("Not yet implemented: probe");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("header_echo", {
        title: "Header echo",
        description: "Send custom request headers through Postman Echo and report whether each one came back unchanged in the response body.",
        inputSchema: z.object({ headers: z.string().describe("Headers as name=value pairs joined by &, for example x-trace=abc&x-run=42."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement echo locally (paywall removed)
        try {
            return textError("Not yet implemented: echo");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("redirect_probe", {
        title: "Redirect probe",
        description: "Ask Postman Echo to redirect and report the status code and Location header it returns, without following the redirect.",
        inputSchema: z.object({ url: z.string().describe("Full URL to redirect to, for example https://example.com."), status_code: z.number().describe("3xx code to ask for, 300-399, default 302.").optional(), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement probe locally (paywall removed)
        try {
            return textError("Not yet implemented: probe");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("json_body_echo", {
        title: "JSON body echo",
        description: "POST a JSON object to Postman Echo and inspect the returned body fields to test JSON request serialization.",
        inputSchema: z.object({ body: z.string().max(4000).describe("JSON object encoded as a string. Defaults to a greeting.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement echo locally (paywall removed)
        try {
            return textError("Not yet implemented: echo");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "postman-echo-mcp";
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
