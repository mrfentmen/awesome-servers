import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WaybackError, domainSnapshots, formatSnapshot, getAvailability, getSnapshots, getSnapshotText, siteHistory, statusHistory, captureGaps, snapshotDiff, brokenPages, prefixInventory, contentProfile } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "wayback-mcp",
        version: "1.0.0",
    });
    server.registerTool("get_snapshots", {
        title: "Get snapshots",
        description: "List the Wayback Machine snapshot history for a URL, optionally limited to a date range.",
        inputSchema: z.object({
            url: z.string().describe("URL to look up, e.g. 'example.com/page.html'"),
            from: z.string().describe("Earliest capture, YYYY or YYYYMMDD.").optional(),
            to: z.string().describe("Latest capture, YYYY or YYYYMMDD.").optional(),
            limit: z.number().int().min(1).max(50).default(10).describe("How many snapshots to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ url, from, to, limit }) => {
        try {
            const snaps = await getSnapshots(url, { limit, from, to });
            if (snaps.length === 0)
                return text(`No archived snapshots of ${url}.`);
            return text(`Snapshots of ${url}:\n\n${snaps.map((s, i) => formatSnapshot(s, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("domain_snapshots", {
        title: "Domain snapshots",
        description: "List archived pages across a whole domain (every path), not just one exact URL.",
        inputSchema: z.object({
            domain: z.string().describe("Domain, e.g. 'example.com' or 'bbc.co.uk'"),
            limit: z.number().int().min(1).max(50).default(20).describe("How many pages to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ domain, limit }) => {
        try {
            const snaps = await domainSnapshots(domain, limit);
            if (snaps.length === 0)
                return text(`Nothing archived for domain ${domain}.`);
            return text(`Archived pages on ${domain}:\n\n${snaps.map((s, i) => formatSnapshot(s, i)).join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("site_history", {
        title: "Site history",
        description: "First and last capture of a URL, plus which years it was archived in.",
        inputSchema: z.object({
            url: z.string().describe("URL to look up"),
            years: z.number().int().min(1).max(40).default(15).describe("How many years to break down"),
        }),
        annotations: READ_ONLY,
    }, async ({ url, years }) => {
        try {
            const h = await siteHistory(url, years);
            if (!h.total)
                return text(`Nothing archived for ${url}.`);
            return text([
                `Archive history for ${url}`,
                `First capture: ${h.first}`,
                `Latest capture: ${h.last}`,
                `Years with at least one capture: ${h.total}`,
                "",
                `Years archived (newest first): ${h.byYear.map((y) => y.year).join(", ")}`,
            ].join("\n"));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("get_availability", {
        title: "Get availability",
        description: "Check whether a page is archived and get its closest snapshot.",
        inputSchema: z.object({ url: z.string().describe("Page URL, e.g. https://example.com") }),
        annotations: READ_ONLY,
    }, async ({ url }) => {
        try {
            const snap = await getAvailability(url);
            if (!snap)
                return text(`No archived snapshot of ${url}.`);
            return text(`Closest snapshot of ${url}:\n\n${formatSnapshot(snap)}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("read_snapshot", {
        title: "Read snapshot",
        description: "Read the text content of an archived page — useful for reading dead or changed sites.",
        inputSchema: z.object({
            timestamp: z.string().describe("Snapshot timestamp from get_snapshots, e.g. '20240101120000'"),
            url: z.string().describe("The original URL that was archived"),
            maxChars: z.number().int().min(500).max(50000).default(15000).describe("Max characters to return"),
        }),
        annotations: READ_ONLY,
    }, async ({ timestamp, url, maxChars }) => {
        try {
            const content = await getSnapshotText(timestamp, url, maxChars);
            if (!content.trim())
                return text(`Snapshot ${timestamp} of ${url} has no readable text.`);
            return text(content);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("compare_years", {
        title: "Compare years",
        description: "Read the same URL as it looked in several different years, to see how a page changed.",
        inputSchema: z.object({
            url: z.string().describe("URL to compare across time"),
            years: z.string().describe("Comma-separated years, e.g. '2015,2020,2024' (max 4)."),
            maxChars: z.number().int().min(200).max(8000).default(1500).describe("Max characters per year"),
        }),
        annotations: READ_ONLY,
    }, async ({ url, years, maxChars }) => {
        try {
            const wanted = years
                .split(",")
                .map((y) => y.trim())
                .filter((y) => /^\d{4}$/.test(y))
                .slice(0, 4);
            if (!wanted.length)
                return text("Provide comma-separated years, e.g. '2015,2020,2024'.");
            const blocks = [];
            for (const year of wanted) {
                const snaps = await getSnapshots(url, { limit: 1, from: `${year}0101`, to: `${year}1231` });
                if (!snaps.length) {
                    blocks.push(`=== ${year}: nothing archived`);
                    continue;
                }
                const content = await getSnapshotText(snaps[0].timestamp, snaps[0].original, maxChars);
                blocks.push(`=== ${year} (captured ${snaps[0].timestamp})\n${content || "no readable text"}`);
            }
            return text(`How ${url} changed:\n\n${blocks.join("\n\n")}`);
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("status_history", {
        title: "Status history",
        description: "One row per archived month with the HTTP status recorded then, so a page that started redirecting or failing can be dated.",
        inputSchema: z.object({
            url: z.string().describe("URL to look up, e.g. 'example.com/page.html'"),
            limit: z.number().int().min(1).max(120).default(24).describe("How many recent months to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ url, limit }) => {
        try {
            return text(await statusHistory(url, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("capture_gaps", {
        title: "Capture gaps",
        description: "How much of a period is actually archived for a URL: captured months, missing months, coverage percent and the longest gap.",
        inputSchema: z.object({
            url: z.string().describe("URL to check, e.g. 'example.com/page.html'"),
            since: z.string().describe("Optional start year, e.g. '2016'").optional(),
        }),
        annotations: READ_ONLY,
    }, async ({ url, since }) => {
        try {
            return text(await captureGaps(url, since));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("snapshot_diff", {
        title: "Diff two snapshots",
        description: "Compare the same page in two archived years and list the wording that appeared and the wording that vanished.",
        inputSchema: z.object({
            url: z.string().describe("URL to compare"),
            yearA: z.string().describe("Earlier year, e.g. '2015'"),
            yearB: z.string().describe("Later year, e.g. '2024'"),
            maxChars: z.number().int().min(1000).max(50000).default(12000).describe("Characters read per year"),
        }),
        annotations: READ_ONLY,
    }, async ({ url, yearA, yearB, maxChars }) => {
        try {
            return text(await snapshotDiff({ url, yearA, yearB, maxChars }));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("broken_pages", {
        title: "Broken archived pages",
        description: "Archived captures across a domain that were not HTTP 200 - redirects and dead pages, which is what link rot looks like.",
        inputSchema: z.object({
            url: z.string().describe("Domain to scan, e.g. 'example.com'"),
            limit: z.number().int().min(1).max(50).default(15).describe("How many captures to show"),
        }),
        annotations: READ_ONLY,
    }, async ({ url, limit }) => {
        try {
            return text(await brokenPages(url, limit));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("content_profile", {
        title: "Archive content profile",
        description: "What a domain's archive is made of rather than when it was captured: every capture grouped into pages, stylesheets, scripts, images, PDFs and the rest, with each family's share, the top mime types, status-code spread and the busiest path prefixes.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to profile, e.g. 'example.com'"),
            limit: z.number().describe("Path prefixes listed, 1-30. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await contentProfile(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    server.registerTool("prefix_inventory", {
        title: "Prefix inventory",
        description: "What lives under a path: the archived URLs beneath a domain prefix, how many there are, the years they span, the sections one level down ranked by size, and the status and content mix. Answers the inventory question behind 'what did this part of the site contain'.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to inventory, e.g. 'example.com'"),
            prefix: z.string().describe("Path prefix starting with '/', or '/' for the whole site. Defaults to '/'.").optional(),
            limit: z.number().describe("Sections listed, 1-40. Defaults to 15.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await prefixInventory(args));
        }
        catch (e) {
            return textError(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof WaybackError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
