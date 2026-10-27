import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { forecast, intensity, regional, nationalFuelMix } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "carbon-intensity-mcp", version: "1.0.0" });
    server.registerTool("intensity", {
        title: "Intensity",
        description: "Current UK grid carbon intensity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await intensity(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("forecast", {
        title: "Forecast",
        description: "Carbon intensity forecast for the next 48 hours.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await forecast(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("regional", {
        title: "Regional",
        description: "Carbon intensity by region.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await regional(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("regional_generation_mix", {
        title: "Regional generation mix",
        description: "Show the live generation mix behind every UK DNO region, ranking by carbon intensity or by the share of a chosen fuel such as coal, gas, nuclear or wind.",
        inputSchema: z.object({ fuel: z.string().describe("Rank by this fuel, e.g. coal or wind.").optional(), limit: z.number().describe("Max regions.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement mix locally (paywall removed)
        try {
            return textError("Not yet implemented: mix");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("national_fuel_mix", {
        title: "National fuel mix",
        description: "The UK national generation mix by fuel in percentage terms, split into renewable, fossil, nuclear and import shares, falling back to a regional roll up when the national endpoint omits the mix.",
        inputSchema: z.object({ fuel: z.string().describe("Highlight one fuel.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nationalFuelMix(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("cleanest_window", {
        title: "Cleanest window",
        description: "Scan the UK carbon intensity forecast and report the cleanest and dirtiest half hour slots in the window, the spread between them and the five best times to run flexible load.",
        inputSchema: z.object({ hours: z.number().describe("Hours ahead, up to 48.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement window locally (paywall removed)
        try {
            return textError("Not yet implemented: window");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "carbon-intensity-mcp";
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
