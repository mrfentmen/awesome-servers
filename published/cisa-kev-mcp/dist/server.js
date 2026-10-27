import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { byCve, byProduct, byVendor, format, info, KevError, ransomware, recent, search, vendors, yearly } from "./api.js";
const text = (s) => ({ content: [{ type: "text", text: s }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({ name: "cisa-kev-mcp", version: "1.0.0" });
    server.registerTool("search_known_exploited", {
        title: "Search known exploited",
        description: "Search CISA's catalog of vulnerabilities known to be exploited in the wild.",
        inputSchema: z.object({ query: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ query }) => { try {
        return text(format(await search(query)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("recent_known_exploited", {
        title: "Recent known exploited",
        description: "List the most recently added entries in the CISA KEV catalog.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(10) }),
        annotations: READ_ONLY,
    }, async ({ limit }) => { try {
        return text(format(await recent(limit)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("catalog_info", {
        title: "Catalog info",
        description: "Get CISA KEV catalog version and release metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => { try {
        return text(format(await info()));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("by_cve", {
        title: "By CVE",
        description: "KEV entry for one CVE id.",
        inputSchema: z.object({ cve: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ cve }) => { try {
        return text(format(await byCve(cve)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("by_vendor", {
        title: "By vendor",
        description: "KEV entries for a vendor like Microsoft.",
        inputSchema: z.object({ vendor: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ vendor }) => { try {
        return text(format(await byVendor(vendor)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("by_product", {
        title: "By product",
        description: "KEV entries for a product.",
        inputSchema: z.object({ product: z.string().min(1) }),
        annotations: READ_ONLY,
    }, async ({ product }) => { try {
        return text(format(await byProduct(product)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("ransomware", {
        title: "Ransomware",
        description: "KEV entries used in known ransomware campaigns.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => { try {
        return text(format(await ransomware()));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("vendors", {
        title: "Vendors",
        description: "Vendor names in the KEV catalog.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => { try {
        return text((await vendors()).join("\n"));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    server.registerTool("yearly", {
        title: "Yearly",
        description: "KEV entries added in one year.",
        inputSchema: z.object({ year: z.string().min(4) }),
        annotations: READ_ONLY,
    }, async ({ year }) => { try {
        return text(format(await yearly(year)));
    }
    catch (e) {
        return textError(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } });
    return server;
}
export { KevError };
