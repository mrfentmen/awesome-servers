import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, technique } from "./free-api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "mitre-attack-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search techniques by keyword.",
        inputSchema: z.object({ query: z.string().describe("Keyword to search, for example phishing or persistence."), limit: z.number().describe("Maximum results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("technique", {
        title: "Technique",
        description: "Get one technique by ID.",
        inputSchema: z.object({ id: z.string().describe("Technique ID, for example T1059.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await technique(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("group_list", {
        title: "Group list",
        description: "The intrusion sets and threat groups MITRE ATT&CK tracks, with aliases and descriptions, which a technique search never returns.",
        inputSchema: z.object({ query: z.string().describe("Filter by group name or alias.").optional(), limit: z.number().describe("Max groups.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("software_list", {
        title: "Software list",
        description: "The malware and tooling entries in the MITRE ATT&CK STIX bundle, with aliases, platforms and labels, which a technique search never returns.",
        inputSchema: z.object({ query: z.string().describe("Filter by name, alias or description.").optional(), limit: z.number().describe("Max entries.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tactic_list", {
        title: "Tactic list",
        description: "ATT&CK's own tactic list, read from the x-mitre-tactic objects in the enterprise STIX bundle, which gives the framework a technique search does not show.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement list locally (paywall removed)
        try {
            return textError("Not yet implemented: list");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("technique_mitigations", {
        title: "Technique mitigations",
        description: "Resolve active ATT&CK mitigation relationships for a technique, with mitigation IDs and technique-specific defensive guidance.",
        inputSchema: z.object({ id: z.string().describe("Technique ID, for example T1059."), limit: z.number().optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement mitigations locally (paywall removed)
        try {
            return textError("Not yet implemented: mitigations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mitre-attack-mcp";
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
