import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { answer, wikipediaPageExists, siteUp, domainTaken, personAlive, domainMail } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "yesno-mcp", version: "1.0.0" });
    server.registerTool("answer", {
        title: "Answer",
        description: "A random yes or no answer.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await answer(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("is_site_up", {
        title: "Is site up",
        description: "Answer a real yes or no question: does this site respond right now? Reports the status code, how long it took and the final URL.",
        inputSchema: z.object({ url: z.string().describe("URL or hostname, for example example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await siteUp(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("is_domain_taken", {
        title: "Is domain taken",
        description: "Answer a real yes or no question: is this domain already registered? Uses the registry's RDAP record and reports registrar dates and status.",
        inputSchema: z.object({ domain: z.string().describe("Domain to check, for example example.com.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domainTaken(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("is_person_alive", {
        title: "Is person alive",
        description: "Answer a real yes or no question from Wikidata: is this person still alive? Reports the birth and death dates on record.",
        inputSchema: z.object({ name: z.string().describe("Person name, for example 'Ada Lovelace'.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await personAlive(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("domain_accepts_mail", {
        title: "Domain accepts mail",
        description: "Check explicit DNS MX records, including null MX; does not test delivery.",
        inputSchema: z.object({ domain: z.string().describe("Domain to check.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await domainMail(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wikipedia_page_exists", {
        title: "Wikipedia page exists",
        description: "Check whether an English Wikipedia page exists, following redirects.",
        inputSchema: z.object({ title: z.string().describe("Title to check.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wikipediaPageExists(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "yesno-mcp";
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
