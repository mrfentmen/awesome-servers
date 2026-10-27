import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { components, incidentDetails, incidents, maintenances } from "./api.js";
import { status } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "github-status-mcp", version: "1.0.0" });
    server.registerTool("status", {
        title: "Status",
        description: "Current GitHub status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await status(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("incidents", {
        title: "Incidents",
        description: "Recent incidents.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await incidents(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("components", {
        title: "Components",
        description: "GitHub component statuses.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await components());
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("maintenances", {
        title: "Maintenances",
        description: "Scheduled maintenances.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await maintenances(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("incident_details", {
        title: "Incident details",
        description: "One incident with updates.",
        inputSchema: z.object({ id: z.string().describe("Incident id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await incidentDetails(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
