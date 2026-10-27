import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dataflows, indicator, nadData } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "oecd-mcp", version: "1.0.0" });
    server.registerTool("indicator", {
        title: "Indicator",
        description: "Get an indicator series.",
        inputSchema: z.object({ dataset: z.string().describe("Dataset id like SNA_TABLE1.").optional(), country: z.string().describe("Country code like AUS."), series: z.string().describe("Series like GDP.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await indicator(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("nad_data", {
        title: "NAD data",
        description: "National accounts via the new OECD API.",
        inputSchema: z.object({ indicator: z.string().describe("Indicator like GDP.").optional(), country: z.string().describe("Country like USA.").optional(), start: z.string().describe("Start year like 2020.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await nadData(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("dataflows", {
        title: "Dataflows",
        description: "Browse OECD dataflows.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await dataflows(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
