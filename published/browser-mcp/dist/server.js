import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { openPage, screenshotPage, pageLinks, pageHeadings, runScript } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "browser-mcp", version: "1.0.0" });
    server.registerTool("open_page", {
        title: "Open page",
        description: "Open a URL in headless Chrome and return the title and a text sample.",
        inputSchema: z.object({ url: z.string().describe("Full URL to open.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await openPage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("screenshot_page", {
        title: "Screenshot page",
        description: "Take a screenshot of a URL and save it to a local file.",
        inputSchema: z.object({ url: z.string().describe("Full URL to capture.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await screenshotPage(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_links", {
        title: "Page links",
        description: "Every absolute link on a page with its anchor text, plus the hosts those links point at.",
        inputSchema: z.object({ url: z.string().describe("Full http or https URL."), limit: z.number().describe("Max links.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageLinks(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("page_headings", {
        title: "Page headings",
        description: "The heading outline of a page, indented by level, with a count per heading level.",
        inputSchema: z.object({ url: z.string().describe("Full http or https URL."), limit: z.number().describe("Max headings.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await pageHeadings(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("run_script", {
        title: "Run script",
        description: "Run a JavaScript expression in a headless Chrome page and return its result.",
        inputSchema: z.object({ url: z.string().describe("Full http or https URL to load first."), script: z.string().describe("JavaScript expression to evaluate in the page.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await runScript(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("dns_records", {
        title: "Public DNS records",
        description: "Resolve a domain through Google DNS over HTTPS and report records, TTLs, DNS response code and authenticated-data status for website troubleshooting.",
        inputSchema: z.object({ domain: z.string().describe("DNS name; defaults to example.com.").optional(), type: z.string().describe("A, AAAA, MX, TXT, NS, CNAME or CAA; defaults to A.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement records locally (paywall removed)
        try {
            return textError("Not yet implemented: records");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "browser-mcp";
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
