import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SetlistApiError, formatSetlist, getArtistByMbid, getSetlist, getSetlists, searchArtists, searchSetlistsBySong, analyze_setlist, compare_setlists, tour_summary } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "setlist-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_artist", {
        title: "Search artist",
        description: "Search Setlist.fm for an artist by name. Returns MusicBrainz IDs (mbid) " +
            "needed by the other tools.",
        inputSchema: z.object({ name: z.string().describe("Artist name, e.g. 'Radiohead' or 'Playboi Carti'") }),
        annotations: READ_ONLY,
    }, async ({ name }) => {
        try {
            const results = await searchArtists(name);
            if (results.length === 0) {
                return text(`No artists found matching "${name}".`);
            }
            const lines = results.map((r, i) => `${i + 1}. ${r.artist.name}` +
                (r.artist.disambiguation ? ` (${r.artist.disambiguation})` : "") +
                ` — mbid: ${r.artist.mbid}`);
            return text(`Artists matching "${name}":\n${lines.join("\n")}`);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_artist_setlists", {
        title: "Get artist setlists",
        description: "Fetch recent concert setlists for an artist by MusicBrainz ID.",
        inputSchema: z.object({
            artistMbid: z.string().describe("MusicBrainz artist ID from search_artist"),
            page: z.number().int().min(1).default(1).describe("Page number"),
            year: z.number().int().optional().describe("Filter to a single year"),
        }),
        annotations: READ_ONLY,
    }, async ({ artistMbid, page, year }) => {
        try {
            const artist = await getArtistByMbid(artistMbid);
            const res = await getSetlists(artistMbid, page, year);
            if (res.total === 0) {
                return text(`No setlists found for ${artist.name}.`);
            }
            const head = `${res.total} setlists on file for ${artist.name} (page ${page}). Latest ${res.setlist.length}:\n`;
            const body = res.setlist
                .slice(0, 10)
                .map((s) => `• ${s.eventDate} @ ${s.venue?.name ?? "?"} — id ${s.id}`)
                .join("\n");
            return text(head + body);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("get_setlist_detail", {
        title: "Get setlist detail",
        description: "Get the full song-by-song setlist for a specific concert.",
        inputSchema: z.object({ setlistId: z.string().describe("Setlist ID (from get_artist_setlists)") }),
        annotations: READ_ONLY,
    }, async ({ setlistId }) => {
        try {
            const s = await getSetlist(setlistId);
            return text(formatSetlist(s));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("count_song_plays", {
        title: "Count song plays",
        description: "Count how many times an artist has played a specific song live, " +
            "with a few example shows.",
        inputSchema: z.object({
            artistMbid: z.string().describe("MusicBrainz artist ID"),
            songName: z.string().describe("Song title, e.g. 'Creep'"),
            maxPages: z.number().int().min(1).max(10).default(3).describe("Pages to scan (each = ~20 shows)"),
        }),
        annotations: READ_ONLY,
    }, async ({ artistMbid, songName, maxPages }) => {
        try {
            const artist = await getArtistByMbid(artistMbid);
            let count = 0;
            const examples = [];
            for (let p = 1; p <= maxPages; p++) {
                const res = await searchSetlistsBySong(artistMbid, songName, p);
                for (const s of res.setlist) {
                    count++;
                    if (examples.length < 5) {
                        examples.push(`${s.eventDate} @ ${s.venue?.name ?? "?"} (id ${s.id})`);
                    }
                }
                if (!res.setlist || res.setlist.length === 0)
                    break;
            }
            const head = `"${songName}" has been played live ${count}+ times by ${artist.name}.\n`;
            const tail = examples.length
                ? `Example shows:\n${examples.map((x) => `• ${x}`).join("\n")}`
                : "No live plays found in the scanned pages.";
            return text(head + tail);
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("analyze_setlist", {
        title: "Analyze a setlist",
        description: "Read one setlist object and say what the show adds up to: how many songs sit in each part, where the encore starts and how big it is, how many songs are credited covers and by whom, which songs carry notes marking an outro, secret or teaser, whether anything is played twice, and how the total length compares with a normal headline set. get_setlist_detail only prints the songs in order.",
        inputSchema: z.object({
            setlist: z.object({}).passthrough().describe("One setlist object, as returned by get_setlist_detail or by the Setlist.fm API. Accepts the full object; only sets, id, eventDate, venue and tour are read."),
        }),
        annotations: READ_ONLY,
    }, async ({ setlist }) => {
        try {
            return text(analyze_setlist({ setlist }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("compare_setlists", {
        title: "Compare two setlists",
        description: "Compare two setlist objects and report what changed between them: which songs were dropped and which added, whether the encore moved and by how many positions, whether the part structure changed, how many shared songs shifted position, and whether this is a rotation of the same material rather than a new set. No existing tool compares two shows.",
        inputSchema: z.object({
            before: z.object({}).passthrough().describe("The earlier setlist object."),
            after: z.object({}).passthrough().describe("The later setlist object."),
        }),
        annotations: READ_ONLY,
    }, async ({ before, after }) => {
        try {
            return text(compare_setlists({ before, after }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tour_summary", {
        title: "Summarise a run of shows",
        description: "Aggregate an array of setlist objects into a picture of a run of shows: the date range and years, how many venues, cities and countries were played, which songs appear in every show and so form the fixed part of the set, the most played songs with their cover credits, songs played only once, how often an encore was recorded, and the average set length. The existing tools print one show at a time and never aggregate.",
        inputSchema: z.object({
            setlists: z.array(z.object({}).passthrough()).describe("An array of setlist objects. Shows without song data are counted but left out of the song statistics, so a list of dates and venues does not distort them."),
        }),
        annotations: READ_ONLY,
    }, async ({ setlists }) => {
        try {
            return text(tour_summary({ setlists }));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "setlist-mcp";
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
    return server;
}
function errorMessage(e) {
    if (e instanceof SetlistApiError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
