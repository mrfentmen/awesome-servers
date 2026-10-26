// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as USPS from "./usps.js";
import { postalLookup, addressGeocode } from "./api.js";
// The tools below are registered with registerTool, which the paywall script reads,
// and that form takes annotations; the older server.tool() blocks above do not.
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
// This file has no text()/textError() helpers, so the two new blocks build their
// own results, matching the style of the older blocks above.
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (value) => ({ content: [{ type: "text", text: value }], isError: true });
export function createServer() {
    const server = new McpServer({ name: "usps-mcp", version: "1.0.0" });
    server.tool("get_rate", "Get USPS shipping rate estimate.", {
        destination: z.string().describe("Destination ZIP code"),
        weight: z.number().describe("Package weight in pounds"),
        service: z.string().optional().describe("Service type (default: PRIORITY)"),
    }, async (args) => {
        try {
            const result = await USPS.getRate(args);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("create_label", "Create a USPS shipping label.", {
        from: z.string().describe("Sender address as JSON: {street,city,state,zip}"),
        to: z.string().describe("Recipient address as JSON: {street,city,state,zip}"),
        weight: z.number().describe("Package weight in pounds"),
        service: z.string().optional().describe("Service type (default: PRIORITY)"),
    }, async (args) => {
        try {
            const from = JSON.parse(args.from);
            const to = JSON.parse(args.to);
            const result = await USPS.createLabel({ ...args, from, to });
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("track_package", "Track a USPS package.", {
        trackingNumber: z.string().describe("USPS tracking number"),
    }, async (args) => {
        try {
            const result = await USPS.trackPackage(args.trackingNumber);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("validate_address", "Validate a USPS address.", {
        street: z.string().describe("Street address"),
        city: z.string().describe("City, e.g. San Francisco"),
        state: z.string().describe("Two-letter state code, e.g. CA"),
        zip: z.string().describe("ZIP code, e.g. 94107"),
    }, async (args) => {
        try {
            const result = await USPS.validateAddress(args);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("get_zip_code", "Look up ZIP code by city and state.", {
        city: z.string().describe("City name, e.g. San Francisco"),
        state: z.string().describe("State abbreviation"),
    }, async (args) => {
        try {
            const result = await USPS.getZipCode(args);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("get_address_info", "Get city/state info from ZIP code.", {
        zip: z.string().describe("ZIP code, e.g. 94107"),
    }, async (args) => {
        try {
            const result = await USPS.getAddressInfo(args.zip);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("schedule_pickup", "Schedule a USPS pickup.", {
        street: z.string().describe("Pickup street address"),
        city: z.string().describe("Pickup city, e.g. San Francisco"),
        state: z.string().describe("Pickup state"),
        zip: z.string().describe("Pickup ZIP code"),
        packageCount: z.number().describe("Number of packages"),
    }, async (args) => {
        try {
            const result = await USPS.schedulePickup({
                address: { street: args.street, city: args.city, state: args.state, zip: args.zip },
                packageCount: args.packageCount,
            });
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.tool("get_service_standards", "Get delivery standards between ZIP codes.", {
        originZip: z.string().describe("Origin ZIP code"),
        destZip: z.string().describe("Destination ZIP code"),
    }, async (args) => {
        try {
            const result = await USPS.getServiceStandards(args.originZip, args.destZip);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }] };
        }
    });
    server.registerTool("postal_lookup", {
        title: "Postal lookup",
        description: "What a postcode actually covers: the country, every place under that code with their coordinates, how many distinct names it names, and whether it identifies one place or a whole city. Public postal database, no USPS key needed.",
        inputSchema: z.object({
            postcode: z.string().describe("Postcode to resolve, e.g. 90210 or SW1A 1AA"),
            country: z.string().describe("Two-letter country code to check a specific one, e.g. us or gb.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await postalLookup(args));
        }
        catch (e) {
            return textError(`Error: ${e.message}`);
        }
    });
    server.registerTool("address_geocode", {
        title: "Address geocode",
        description: "Resolves a typed address to coordinates with the US Census geocoder and shows the standardised form it matched, its parsed components and TIGER line; pass 'latitude, longitude' as reverse to go the other way. No USPS key needed.",
        inputSchema: z.object({
            address: z.string().describe("Address to resolve, e.g. '1600 Pennsylvania Ave NW, Washington, DC 20500'"),
            reverse: z.string().describe("Instead of an address, a 'latitude, longitude' point to resolve back to an address.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await addressGeocode(args));
        }
        catch (e) {
            return textError(`Error: ${e.message}`);
        }
    });
    const serverName = "usps-mcp";
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
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
