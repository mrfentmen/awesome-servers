import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { explain, format } from "./lens.js";
import { checkToolchainDeclarations, reproducibilityGapMatrix } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "toolchain-lens-mcp", version: "1.0.0" });
    server.registerTool("explain_toolchain", {
        title: "Explain toolchain",
        description: "Explain local reproducibility signals and contradictions without returning exact versions, dependency names, or secret values.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async ({ project }) => {
        try {
            return text(format(await explain(project)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("reproducibility_gap_matrix", {
        title: "Reproducibility gap matrix",
        description: "Cross local manifests, lockfiles, container files and CI files into a capability by ecosystem matrix (pinned runtime, lockfile, frozen install, container base, CI runtime setup, integrity checksums), report cell coverage and the ranked gaps. Versions, dependency names and filenames are never returned.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).describe("Local project directory; no URLs") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await reproducibilityGapMatrix(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("check_toolchain_declarations", {
        title: "Check toolchain declarations",
        description: "Check manifest and CI documents you supply for contradictions: a runtime that names several majors inside one document or disagrees across documents, and package-manager declarations that do not match the lockfile signals present. Document text is never echoed.",
        inputSchema: z.object({ documents: z.array(z.string().max(200000)).min(1).max(40).describe("Manifest or CI document contents, up to 40 entries of 200,000 characters each.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await checkToolchainDeclarations(args));
        }
        catch (error) {
            return errorText(error);
        }
    });
    const serverName = "toolchain-lens-mcp";
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
