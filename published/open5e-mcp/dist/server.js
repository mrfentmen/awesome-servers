import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { monsters, spells } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "open5e-mcp", version: "1.0.0" });
    server.registerTool("monsters", {
        title: "Monsters",
        description: "List monsters with optional search.",
        inputSchema: z.object({ search: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await monsters(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spells", {
        title: "Spells",
        description: "List spells with optional search.",
        inputSchema: z.object({ search: z.string().describe("Search terms.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spells(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("monster_detail", {
        title: "Monster detail",
        description: "Full statblock for one Open5e monster: size, type, alignment, challenge rating, armour class, hit points, speed, ability scores, languages, traits, actions and reactions.",
        inputSchema: z.object({ name: z.string().describe("Monster name, e.g. 'goblin' or 'adult red dragon'."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spell_detail", {
        title: "Spell detail",
        description: "Full Open5e entry for one spell: level, school, casting time, range, components, duration, ritual flag, who can cast it and the description.",
        inputSchema: z.object({ name: z.string().describe("Spell name, e.g. 'fireball'."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement detail locally (paywall removed)
        try {
            return textError("Not yet implemented: detail");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("classes", {
        title: "Classes",
        description: "List Open5e character classes with hit die, hit point progression, saving throw and armour proficiencies, and available archetypes.",
        inputSchema: z.object({ limit: z.number().describe("Max classes, 1-30, default 12.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement classes locally (paywall removed)
        try {
            return textError("Not yet implemented: classes");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "open5e-mcp";
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
    return server;
}
