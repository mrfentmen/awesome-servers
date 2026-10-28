import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatComic, getComic, latestComic, XkcdError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const fail = (t) => ({ content: [{ type: "text", text: t }], isError: true });
export function createServer() {
    const server = new McpServer({
        name: "xkcd-mcp",
        version: "1.0.0",
    });
    server.tool("latest_comic", "Get the newest xkcd comic.", {}, async () => {
        try {
            return text(formatComic(await latestComic()));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    server.tool("get_comic", "Get an xkcd comic by number.", { num: z.number().int().min(1).describe("Comic number, e.g. 200") }, async ({ num }) => {
        try {
            return text(formatComic(await getComic(num)));
        }
        catch (e) {
            return fail(errorMessage(e));
        }
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof XkcdError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
