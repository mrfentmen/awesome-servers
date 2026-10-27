import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup, myIp, reverse_lookup } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ip-geo-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Geolocate an IP address.",
        inputSchema: z.object({ ip: z.string().describe("IP address to look up.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("my_ip", {
        title: "My ip",
        description: "Geolocate the current machine public IP.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await myIp(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("batch_lookup", {
        title: "Batch lookup",
        description: "Resolve up to fifteen IP addresses in a single request to ip-api and report where they are, which of them failed and why, and then the counts that make the list readable: how many distinct countries, which addresses share an autonomous system, and whether the batch spans more than one time zone. The existing lookup resolves one address per call, so fifteen of them costs fifteen requests against a forty-five a minute limit.",
        inputSchema: z.object({
            ips: z.array(z.string().min(1).max(60)).min(1).max(15).describe("Up to 15 IP addresses. ip-api's free tier caps a batch at 15 rows."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reverse_lookup", {
        title: "Reverse lookup",
        description: "Resolve a hostname to the address it currently points at and geolocate that address, so you get back dns.google rather than 8.8.8.8. Also reports the name the address itself is registered under, and calls out that a CDN or anycast name resolves to one of many possible answers. lookup only accepts an address and cannot take a name at all.",
        inputSchema: z.object({
            hostname: z.string().min(1).max(253).describe("Hostname to resolve, for example dns.google."),
        }),
        annotations: READ_ONLY,
    }, async ({ hostname }) => {
        try {
            return text(await reverse_lookup({ hostname }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("compare_locations", {
        title: "Compare locations",
        description: "Geolocate two to six IP addresses and put them side by side: whether they share a country, a time zone, an autonomous system and an ISP, plus the great-circle distance between every pair in kilometres or metres. The existing tools print one address each with no way to see the two together, and no distance at all.",
        inputSchema: z.object({
            ips: z.array(z.string().min(1).max(60)).min(2).max(6).describe("Two to six IP addresses to compare."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement locations locally (paywall removed)
        try {
            return textError("Not yet implemented: locations");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_profile", {
        title: "Network profile",
        description: "What kind of network an IP sits on: continent, reverse name, and the mobile/proxy/hosting flags ip-api returns but no other tool here asks for.",
        inputSchema: z.object({ ip: z.string().describe("IP address to profile.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ip-geo-mcp";
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
