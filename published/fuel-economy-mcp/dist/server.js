import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { vehicleMpg, modelsForMake } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fuel-economy-mcp", version: "1.0.0" });
    server.registerTool("vehicle_mpg", {
        title: "Vehicle mpg",
        description: "Get fuel economy for a make, model, and year.",
        inputSchema: z.object({ make: z.string().describe("Make like Honda."), model: z.string().describe("Model like Civic."), year: z.number().describe("Model year.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await vehicleMpg(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("makes_for_year", {
        title: "Makes for year",
        description: "List the vehicle makes the EPA fuel economy database covers for a given model year.",
        inputSchema: z.object({ year: z.number().describe("Model year, 1984 onwards."), limit: z.number().int().min(1).max(100).default(25).describe("Max makes.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement year locally (paywall removed)
        try {
            return textError("Not yet implemented: year");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("models_for_make", {
        title: "Models for make",
        description: "List the models the EPA fuel economy database has for a make in a given model year.",
        inputSchema: z.object({ year: z.number().describe("Model year, 1984 onwards."), make: z.string().describe("Make, e.g. Toyota."), limit: z.number().int().min(1).max(100).default(25).describe("Max models.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await modelsForMake(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("vehicle_data", {
        title: "Vehicle data",
        description: "The full EPA record for one vehicle id: class, powertrain, transmission, fuel economy, range, SmartWay score and fuel cost saving.",
        inputSchema: z.object({ id: z.string().describe("Numeric EPA vehicle id, e.g. 31724.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement data locally (paywall removed)
        try {
            return textError("Not yet implemented: data");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fuel-economy-mcp";
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
