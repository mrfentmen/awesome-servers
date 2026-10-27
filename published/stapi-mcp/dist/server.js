import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatCharacter, getCharacter, searchCharacters, StapiError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "stapi-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_characters", {
        title: "Search characters",
        description: "Search Star Trek characters by name across all series and movies.",
        inputSchema: z.object({
            name: z.string().describe("Name to search, e.g. 'Picard', 'Spock', 'Janeway'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const results = await searchCharacters(args.name, args.limit);
            if (results.length === 0)
                return text(`No Star Trek characters match "${args.name}".`);
            return text(`Star Trek characters for "${args.name}":\n\n${results.map((c, i) => formatCharacter(c, i)).join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_character", {
        title: "Get character details",
        description: "Get a Star Trek character by uid: gender, birth year and place, height, marital status.",
        inputSchema: z.object({
            uid: z.string().describe("Character uid, e.g. 'CHMA0000015352' (use search_characters to find it)"),
        }),
        annotations: READ_ONLY,
    }, async ({ uid }) => {
        try {
            const c = await getCharacter(uid);
            if (!c)
                return text(`No Star Trek character ${uid}.`);
            return text(formatCharacter(c));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_species", {
        title: "Search species",
        description: "Search Star Trek species by name and report the traits STAPI records: warp capable, humanoid, reptilian, telepathic and so on.",
        inputSchema: z.object({
            name: z.string().describe("Species name, e.g. 'Vulcan' or 'Human'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement species locally (paywall removed)
        try {
            return textError("Not yet implemented: species");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_locations", {
        title: "Search locations",
        description: "Search Star Trek locations by name and report what STAPI classifies each one as: station, colony, shipyard, landmark and so on.",
        inputSchema: z.object({
            name: z.string().describe("Location name, e.g. 'Yorktown' or 'Starbase'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement locations locally (paywall removed)
        try {
            return textError("Not yet implemented: locations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search_organizations", {
        title: "Search organizations",
        description: "Search Star Trek organizations by name and report what kind each one is: military, research, government, law enforcement and so on.",
        inputSchema: z.object({
            name: z.string().describe("Organization name, e.g. 'Starfleet'"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement organizations locally (paywall removed)
        try {
            return textError("Not yet implemented: organizations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_series", {
        title: "List series",
        description: "Every Star Trek series in the STAPI database, with abbreviation, production years, original run, broadcaster, studio, season and episode counts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement series locally (paywall removed)
        try {
            return textError("Not yet implemented: series");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "stapi-mcp";
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
    if (e instanceof StapiError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
