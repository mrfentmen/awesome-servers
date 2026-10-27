import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, inspectLicenseBoundary } from "./core.js";
import { searchSpdx, spdxLicense, spdxException } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "license-boundary-mcp", version: "1.0.0" });
    server.registerTool("inspect_license_boundary", {
        title: "Inspect license boundary",
        description: "Summarize local license evidence and uncertainty without returning package names, license text, paths, or source.",
        inputSchema: z.object({ project: z.string().min(1).max(1000).default(".") }),
        annotations: READ_ONLY,
    }, async (input) => { try {
        return text(format(await inspectLicenseBoundary(input)));
    }
    catch (error) {
        return errorText(error);
    } });
    server.registerTool("search_spdx", {
        title: "Search spdx",
        description: "Search the live SPDX license catalog by name or identifier.",
        inputSchema: z.object({ query: z.string().max(200).optional(), limit: z.number().int().min(1).max(30).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await searchSpdx(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spdx_license", {
        title: "Spdx license",
        description: "Read public SPDX license text and approval flags.",
        inputSchema: z.object({ id: z.string().regex(/^[A-Za-z0-9.+-]+$/).default("MIT") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spdxLicense(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("spdx_exception", {
        title: "Spdx exception",
        description: "Read public SPDX linking-exception text and notes.",
        inputSchema: z.object({ id: z.string().regex(/^[A-Za-z0-9.+-]+$/).default("Classpath-exception-2.0") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await spdxException(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("npm_license_evidence", {
        title: "Npm license evidence",
        description: "Retrieve publisher-declared license evidence for a public npm package; sends only the provided public package identifier.",
        inputSchema: z.object({ package: z.string().min(1).max(214).default("express"), version: z.string().min(1).max(100).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement evidence locally (paywall removed)
        try {
            return textError("Not yet implemented: evidence");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("repo_license_evidence", {
        title: "Repo license evidence",
        description: "Retrieve GitHub license detection and evidence hash for a public repository; sends only the supplied owner and repository.",
        inputSchema: z.object({ owner: z.string().min(1).max(100).default("expressjs"), repo: z.string().min(1).max(100).default("express") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement evidence locally (paywall removed)
        try {
            return textError("Not yet implemented: evidence");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "license-boundary-mcp";
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
