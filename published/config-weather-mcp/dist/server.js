import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectConfigWeather, inspectEnvContract, inspectConfigLayers } from "./core.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "config-weather-mcp", version: "1.0.0" });
    server.registerTool("inspect_config_weather", {
        title: "Inspect config weather",
        description: "Measure local configuration complexity and environment contract pressure without returning values, keys, paths, or source.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await inspectConfigWeather(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("inspect_env_contract", {
        title: "Inspect env contract",
        description: "Compare the environment keys a project references against the keys its .env files define, reporting what is referenced but never defined, what is defined but never used, and keys defined in more than one file.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(format(await inspectEnvContract(input)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("inspect_config_layers", {
        title: "Inspect config layers",
        description: "Group a project's configuration files by the environment layer their path implies, such as production, staging, development, test or container, with line counts and files that match more than one layer.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => {
        try {
            return text(format(await inspectConfigLayers(input)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "config-weather-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    return server;
}
