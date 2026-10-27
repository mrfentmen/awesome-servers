import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { boardPins, formatBoard, formatPin, getBoard, getPin, listBoards, myAccount, PinterestError, imageSources, findLicensedImages, imageLicence } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "pinterest-mcp",
        version: "1.0.0",
    });
    server.registerTool("my_account", {
        title: "My account",
        description: "Your Pinterest account: username, profile image, website.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const a = await myAccount();
            return text(`@${a.username ?? "?"}${a.websiteUrl ? `\n${a.websiteUrl}` : ""}${a.profileImage ? `\n${a.profileImage}` : ""}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_boards", {
        title: "List boards",
        description: "Your Pinterest boards: names, descriptions, pin counts.",
        inputSchema: z.object({
            limit: z.number().int().min(1).max(250).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ limit }) => {
        try {
            const rows = await listBoards(limit);
            if (rows.length === 0)
                return text("No boards.");
            return text(rows.map((b, i) => formatBoard(b, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_board", {
        title: "Get board",
        description: "One Pinterest board with its pins.",
        inputSchema: z.object({
            id: z.string().describe("Board ID, e.g. 1234567890"),
            limit: z.number().int().min(1).max(250).default(10),
        }),
        annotations: READ_ONLY,
    }, async ({ id, limit }) => {
        try {
            const b = await getBoard(id);
            const pins = await boardPins(id, limit);
            return text(`${formatBoard(b)}\n\nPins:\n\n${pins.map((p, i) => formatPin(p, i)).join("\n\n") || "(none)"}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_pin", {
        title: "Get pin",
        description: "One Pinterest pin: title, description, link, image.",
        inputSchema: z.object({
            id: z.string().describe("Pin ID, e.g. 1234567890"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(formatPin(await getPin(id)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("find_licensed_images", {
        title: "Find openly licensed images",
        description: "Search the Openverse index of openly licensed images, optionally restricted to one source or to commercial-use licences, with the licence each result carries.",
        inputSchema: z.object({
            query: z.string().describe("What to look for, e.g. 'mountain landscape'"),
            limit: z.number().describe("Max results, 1-20. Defaults to 8.").optional(),
            source: z.string().describe("Restrict to one source, e.g. 'flickr', 'wikimedia', 'stocksnap'.").optional(),
            commercial_only: z.boolean().describe("Only return licences that permit commercial use.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await findLicensedImages(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("image_licence", {
        title: "Image licence and attribution",
        description: "The licence, creator, source page and attribution string behind one Openverse image, given its Openverse id.",
        inputSchema: z.object({
            id: z.string().describe("Openverse image id (a UUID), e.g. f561777d-24ea-483f-9cf8-f17aa1fd6aa3"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await imageLicence(args.id));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("image_sources", {
        title: "Image pool profile",
        description: "How the openly licensed image index is made up for a search: which source and which licence dominates, the largest images found, and the size of the whole index by source.",
        inputSchema: z.object({
            query: z.string().describe("Search term to profile, e.g. 'architecture'"),
            limit: z.number().describe("Sample size, 1-50. Defaults to 20.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await imageSources(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "pinterest-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof PinterestError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
