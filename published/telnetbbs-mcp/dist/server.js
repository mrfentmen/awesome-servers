import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BbsError, formatBbs, listAll } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "telnetbbs-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_bbses", {
        title: "List bbses",
        description: "List live retro BBSes you can dial into right now. Optionally filter " +
            "by name or software (Synchronet, Mystic, WWIV).",
        inputSchema: z.object({
            query: z.string().optional().describe("Filter by name or software keyword"),
            limit: z.number().int().min(1).max(50).default(15),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            let all = await listAll();
            if (query) {
                const q = query.toLowerCase();
                all = all.filter((b) => b.name.toLowerCase().includes(q) ||
                    (b.software ?? "").toLowerCase().includes(q));
            }
            if (all.length === 0)
                return text(`No BBSes match "${query ?? ""}".`);
            const shown = all.slice(0, limit);
            return text(`${shown.length} of ${all.length} BBSes:\n\n` +
                shown.map((b, i) => formatBbs(b, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_bbs", {
        title: "Get bbs",
        description: "Get the full listing for a specific BBS by name.",
        inputSchema: z.object({ name: z.string().describe("BBS name, e.g. '0xDECAFBAD BBS'") }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            const all = await listAll();
            const found = all.find((b) => b.name.toLowerCase() === name.toLowerCase());
            if (!found)
                return text(`No BBS named "${name}". Try list_bbses first.`);
            return text(formatBbs(found));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("random_bbs", {
        title: "Random bbs",
        description: "Pick a random live BBS to explore, for the true dial up experience.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const all = await listAll();
            if (all.length === 0)
                return text("No BBSes found.");
            const pick = all[Math.floor(Math.random() * all.length)];
            return text(`Dialing ${pick.name}...\n\n${formatBbs(pick)}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("software_census", {
        title: "Software census",
        description: "How many live BBSes in the Telnet BBS Guide run each software package, " +
            "most common first.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(60).default(20) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement census locally (paywall removed)
        try {
            return textError("Not yet implemented: census");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("bbs_stats", {
        title: "Bbs stats",
        description: "Counts for the whole Telnet BBS Guide listing: how many systems are up, " +
            "how many also accept SSH, how many locations and which connection types they use.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement stats locally (paywall removed)
        try {
            return textError("Not yet implemented: stats");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ssh_bbses", {
        title: "SSH BBSes",
        description: "Find BBSes that publish SSH addresses, with connection details and software.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement bbses locally (paywall removed)
        try {
            return textError("Not yet implemented: bbses");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "telnetbbs-mcp";
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
function errorMessage(e) {
    if (e instanceof BbsError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
