import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { recallByCampaign, recallsByVehicle } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "car-recalls-mcp", version: "1.0.0" });
    server.registerTool("recalls_by_vehicle", {
        title: "Recalls by vehicle",
        description: "Get recalls for a make, model, and year.",
        inputSchema: z.object({ make: z.string().describe("Make like Toyota."), model: z.string().describe("Model like Camry."), year: z.number().describe("Model year.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recallsByVehicle(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recall_by_campaign", {
        title: "Recall by campaign",
        description: "Get a recall by campaign number.",
        inputSchema: z.object({ campaign: z.string().describe("Campaign number like 20V682000.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await recallByCampaign(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("safety_complaints", {
        title: "Safety complaints",
        description: "NHTSA owner safety complaints for a vehicle model year, with crash, fire, injury and death counts.",
        inputSchema: z.object({ make: z.string().describe("Make, e.g. toyota."), model: z.string().describe("Model, e.g. camry."), year: z.number().describe("Model year, e.g. 2018."), limit: z.number().describe("Max complaints.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement complaints locally (paywall removed)
        try {
            return textError("Not yet implemented: complaints");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("model_years", {
        title: "Model years",
        description: "Which vehicle model years NHTSA holds data for, by issue type: recalls, complaints, vehicles, investigations or equipment.",
        inputSchema: z.object({ issueType: z.string().describe("r recalls, c complaints, v vehicles, i investigations, e equipment.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement years locally (paywall removed)
        try {
            return textError("Not yet implemented: years");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "car-recalls-mcp";
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
