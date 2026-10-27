import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatFlow, getFlow, listFlows, NodeRedError, flowGraphAudit, wiringReport, flowLint } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "nodered-mcp",
        version: "1.0.0",
    });
    server.registerTool("list_flows", {
        title: "List flows",
        description: "Node-RED flow tabs with ids and labels. Set NODERED_URL for non-default hosts.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        try {
            const rows = await listFlows();
            if (rows.length === 0)
                return text("No flows.");
            return text(rows.map((f, i) => `${i + 1}. [${f.id}] ${f.label ?? "(unnamed)"}${f.disabled ? " (disabled)" : ""}`).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_flow", {
        title: "Get flow",
        description: "One flow: node count plus node-type breakdown.",
        inputSchema: z.object({
            id: z.string().describe("Flow tab id (use list_flows)"),
        }),
        annotations: READ_ONLY,
    }, async ({ id }) => {
        try {
            return text(formatFlow(id, await getFlow(id)));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("flow_graph_audit", {
        title: "Flow graph audit",
        description: "Audit the shape of a Node-RED flow you supply as JSON: node type breakdown, nodes per tab, how many are disabled, wire volume per node, how much inline function, subflow and template code it carries, how many nodes have an info comment, and the layout bounding box. Code is measured by length only, never printed.",
        inputSchema: z.object({ flow: z.string().describe("The flow as the JSON array Node-RED exports, up to 4 MB.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await flowGraphAudit(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("wiring_report", {
        title: "Wiring report",
        description: "Trace the wiring topology of a Node-RED flow you supply as JSON: the wire count, the nodes with no inbound wire and the nodes with no outbound wire, the longest chain from a source to a sink, where fan-out and fan-in concentrate, and any wire pointing at a node id the flow does not contain.",
        inputSchema: z.object({ flow: z.string().describe("The flow as the JSON array Node-RED exports."), limit: z.number().describe("Entries to list per section, 1-25.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await wiringReport(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("flow_lint", {
        title: "Flow lint",
        description: "Static lint of a Node-RED flow before deploy: duplicate node ids, nodes with no type, function nodes with an empty body, wires naming an id the flow does not contain, nodes wired to nothing in either direction, unnamed function nodes, and comments with no text.",
        inputSchema: z.object({ flow: z.string().describe("The flow as the JSON array Node-RED exports.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await flowLint(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nodered-mcp";
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
function errorMessage(e) {
    if (e instanceof NodeRedError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
