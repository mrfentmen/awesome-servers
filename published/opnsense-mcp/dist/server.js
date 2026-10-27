import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getFirmwareStatus, getInterfaces, ipOwnership, knownExploitedCheck, packageAvailability } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "opnsense-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_firmware_status", {
        title: "Firmware status",
        description: "Installed version and whether an update is available.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getFirmwareStatus());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_interfaces", {
        title: "Interface stats",
        description: "Traffic counters per interface.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async ({}) => {
        try {
            return text(await getInterfaces());
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_ownership", {
        title: "IP ownership",
        description: "Who actually owns an address that just appeared in a firewall log, from the registry rather than a guess: registrant and abuse contact, the exact range and announced CIDR, allocation type and parent block, and the registry events, so you can tell a cloud provider range from a customer allocation before you decide whether it is abuse-reportable.",
        inputSchema: z.object({ ip: z.string().describe("An IPv4 address, e.g. 8.8.8.8.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ipOwnership(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("known_exploited_check", {
        title: "Known exploited check",
        description: "Check what you run against CISA's known exploited vulnerabilities catalog: optionally match a list of products you operate, then always report how many entries are past their remediation due date, how many are linked to ransomware, and the most recently added firewall, VPN and network-edge entries with their due dates.",
        inputSchema: z.object({
            products: z.string().describe("Products you run, comma or newline separated, e.g. 'fortios, pfsense, apache24'.").optional(),
            limit: z.number().describe("How many entries to list, 1-20.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await knownExploitedCheck(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("package_availability", {
        title: "Package availability",
        description: "What an OPNsense release branch actually offers in its public package repository: how many packages, how many are core os- plugins, whether a named package exists for that branch and at which version, and a note on what the trailing ABI revision in a version string means.",
        inputSchema: z.object({
            branch: z.string().describe("Release branch under FreeBSD:14:amd64, e.g. 26.1. Omit to get the list of branches.").optional(),
            package: z.string().describe("Package name to look for, e.g. os-wireguard.").optional(),
            limit: z.number().describe("How many packages to list, 1-20.").optional()
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await packageAvailability(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "opnsense-mcp";
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
