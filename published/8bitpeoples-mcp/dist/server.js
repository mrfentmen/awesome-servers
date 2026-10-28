import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BitError, formatRelease, getRelease, listReleases } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
export function createServer() {
    const server = new McpServer({
        name: "8bitpeoples-mcp",
        version: "1.0.0",
    });
    server.tool("list_releases", "Browse the 8bitpeoples catalog. Chiptune and chip-hop releases, " +
        "mostly free to download.", { page: z.number().int().min(1).default(1).describe("Catalog page (about 24 releases each)") }, async ({ page }) => {
        try {
            const releases = await listReleases(page);
            if (releases.length === 0)
                return text(`Nothing on catalog page ${page}.`);
            return text(`8bitpeoples catalog page ${page}:\n\n` +
                releases.map((r, i) => formatRelease(r, i)).join("\n\n"));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("get_release", "Get details for one release: artist, description, price.", { slug: z.string().describe("Release slug, e.g. '520414-sievert-chips-dips-and-facerips'") }, async ({ slug }) => {
        try {
            const r = await getRelease(slug);
            if (!r)
                return text(`No release at ${slug}.`);
            return text(formatRelease(r));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof BitError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
