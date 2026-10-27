// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { computeChecksums, formatFileSize, getDownloadUrl, parseSaveFile, scanCollection, searchInternetArchive, searchRomsGames, searchCoolrom, searchArcadePunks, searchRomsFun, searchRedditRoms, searchAllSources, verifyChecksum, } from "./romdb.js";
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
function formatResults(results, query) {
    if (results.length === 0)
        return `No ROMs found for "${query}"`;
    const lines = results.map((r) => ({
        title: r.title,
        source: r.source,
        link: r.link || `https://archive.org/details/${r.identifier}`,
        size: r.size ? formatFileSize(r.size) : undefined,
        creator: r.creator,
        date: r.date,
        downloads: r.downloads,
    }));
    return JSON.stringify(lines, null, 2);
}
async function handleSearchAll(query, consoleFilter) {
    const results = await searchAllSources(query, consoleFilter);
    return formatResults(results, query);
}
async function handleSearchRomsGames(query, consoleFilter) {
    const results = await searchRomsGames(query, consoleFilter);
    return formatResults(results, query);
}
async function handleSearchCoolrom(query) {
    const results = await searchCoolrom(query);
    return formatResults(results, query);
}
async function handleSearchArcadePunks(query) {
    const results = await searchArcadePunks(query);
    return formatResults(results, query);
}
async function handleSearchRomsFun(query, consoleFilter) {
    const results = await searchRomsFun(query, consoleFilter);
    return formatResults(results, query);
}
async function handleSearchRedditRoms(query, sort, time) {
    const results = await searchRedditRoms(query, sort, time);
    return formatResults(results, query);
}
async function handleSearch(query, maxResults) {
    const results = await searchInternetArchive(query, "software", maxResults);
    if (results.length === 0) {
        return `No ROMs found for "${query}"`;
    }
    const lines = results.map((r) => ({
        title: r.title,
        identifier: r.identifier,
        creator: r.creator || "unknown",
        date: r.date || "unknown",
        size: r.size ? formatFileSize(r.size) : "unknown",
        downloads: r.downloads || 0,
        link: `https://archive.org/details/${r.identifier}`,
    }));
    return JSON.stringify(lines, null, 2);
}
async function handleVerify(filepath) {
    const checksums = await computeChecksums(filepath);
    const verified = await verifyChecksum(checksums.crc32, checksums.md5, checksums.sha1);
    return JSON.stringify({
        filepath,
        size: formatFileSize(checksums.size),
        md5: checksums.md5,
        sha1: checksums.sha1,
        verified: verified.match,
        game: verified.game || undefined,
        source: verified.source || undefined,
    }, null, 2);
}
async function handleMatch(md5, sha1, crc32) {
    if (!md5 && !sha1 && !crc32) {
        return "Provide at least one hash (md5, sha1, or crc32)";
    }
    const result = await verifyChecksum(crc32, md5, sha1);
    return JSON.stringify(result, null, 2);
}
async function handleParseSave(filepath) {
    const info = await parseSaveFile(filepath);
    return JSON.stringify(info, null, 2);
}
async function handleScan(directory) {
    const entries = await scanCollection(directory);
    if (entries.length === 0) {
        return `No ROM files found in ${directory}`;
    }
    const summary = {
        total: entries.length,
        totalSize: entries.reduce((sum, e) => sum + e.size, 0),
        roms: entries.map((e) => ({
            file: e.filename,
            size: formatFileSize(e.size),
            md5: e.md5,
            console: e.console || "unknown",
            valid: e.valid,
        })),
    };
    return JSON.stringify(summary, null, 2);
}
async function handleDownloadLink(identifier, filename) {
    return getDownloadUrl(identifier, filename);
}
async function handleDownload(identifier, filename, outputDir) {
    await mkdir(outputDir, { recursive: true });
    const url = await getDownloadUrl(identifier, filename);
    const res = await fetch(url);
    if (!res.ok)
        throw new Error(`Download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const filepath = `${outputDir}/${filename}`;
    await writeFile(filepath, buf);
    return `Downloaded ${formatFileSize(buf.length)} to ${filepath}`;
}
export function createServer() {
    const server = new McpServer({ name: "rom-mcp", version: "1.1.0" });
    server.registerTool("search_rom", {
        title: "Search rom",
        description: "Search Internet Archive for game ROMs by title, console, or keyword. Returns download links and metadata.",
        inputSchema: z.object({
            query: z.string().describe("Game title or keyword to search for"),
            max_results: z.number().min(1).max(50).optional().describe("Maximum results to return"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearch(args.query, args.max_results ?? 20);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("verify_rom", {
        title: "Verify rom",
        description: "Verify a ROM file against known checksums. Computes MD5, SHA1 and checks against databases.",
        inputSchema: z.object({ filepath: z.string().describe("Path to the ROM file on disk") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleVerify(args.filepath);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Verify error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("match_by_checksum", {
        title: "Match by checksum",
        description: "Identify a game by providing its MD5, SHA1, or CRC32 hash.",
        inputSchema: z.object({
            md5: z.string().optional().describe("MD5 hash of the ROM"),
            sha1: z.string().optional().describe("SHA1 hash of the ROM"),
            crc32: z.string().optional().describe("CRC32 hash of the ROM"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleMatch(args.md5, args.sha1, args.crc32);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Match error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("parse_save_file", {
        title: "Parse save file",
        description: "Read and parse an emulator save file (.sav, .srm, .states).",
        inputSchema: z.object({ filepath: z.string().describe("Path to the save file") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleParseSave(args.filepath);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Parse error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("scan_collection", {
        title: "Scan collection",
        description: "Scan a directory of ROMs and identify all game files, compute checksums.",
        inputSchema: z.object({ directory: z.string().describe("Path to the ROM collection directory") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleScan(args.directory);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Scan error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("get_download_link", {
        title: "Get download link",
        description: "Get the direct download URL for a ROM from Internet Archive.",
        inputSchema: z.object({
            identifier: z.string().describe("The Internet Archive identifier"),
            filename: z.string().optional().describe("Specific filename to download"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleDownloadLink(args.identifier, args.filename);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("download_rom", {
        title: "Download rom",
        description: "Download a ROM from Internet Archive to a local directory.",
        inputSchema: z.object({
            identifier: z.string().describe("Internet Archive identifier"),
            filename: z.string().describe("Filename to save as"),
            output_dir: z.string().describe("Directory to save the ROM into"),
        }),
        annotations: WRITE,
    }, async (args) => {
        try {
            const text = await handleDownload(args.identifier, args.filename, args.output_dir);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Download error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("search_all_sources", {
        title: "Search all sources",
        description: "Search across all ROM sources: Internet Archive, ROMsgames.net, CoolROM, Arcade Punks, ROMsFun, and Reddit r/Roms.",
        inputSchema: z.object({
            query: z.string().describe("Game title or keyword to search for"),
            console_filter: z.string().optional().describe("Console type to filter by (e.g. 'nes', 'snes', 'gba')"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearchAll(args.query, args.console_filter);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("search_romsgames", {
        title: "Search romsgames",
        description: "Search ROMsgames.net for game ROMs.",
        inputSchema: z.object({
            query: z.string().describe("Game title or keyword to search for"),
            console_filter: z.string().optional().describe("Console type to filter by"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearchRomsGames(args.query, args.console_filter);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("search_coolrom", {
        title: "Search coolrom",
        description: "Search CoolROM for game ROMs.",
        inputSchema: z.object({
            query: z.string().describe("Game title or keyword to search for"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearchCoolrom(args.query);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("search_arcadepunks", {
        title: "Search arcadepunks",
        description: "Search Arcade Punks for ROMs and related content.",
        inputSchema: z.object({
            query: z.string().describe("Game title or keyword to search for"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearchArcadePunks(args.query);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("search_romsfun", {
        title: "Search romsfun",
        description: "Search ROMsFun for game ROMs.",
        inputSchema: z.object({
            query: z.string().describe("Game title or keyword to search for"),
            console_filter: z.string().optional().describe("Console type to filter by"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearchRomsFun(args.query, args.console_filter);
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("search_reddit_roms", {
        title: "Search reddit roms",
        description: "Search Reddit r/Roms for community discussions and recommendations about ROMs.",
        inputSchema: z.object({
            query: z.string().describe("Search term for Reddit r/Roms"),
            sort: z.enum(["relevance", "new", "top", "comments"]).optional().describe("Sort order"),
            time: z.enum(["hour", "day", "week", "month", "year", "all"]).optional().describe("Time filter"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            const text = await handleSearchRedditRoms(args.query, args.sort ?? "relevance", args.time ?? "all");
            return { content: [{ type: "text", text }] };
        }
        catch (err) {
            return { content: [{ type: "text", text: `Search error: ${err.message}` }], isError: true };
        }
    });
    server.registerTool("detect_console", {
        title: "Detect console",
        description: "Detect the likely game console from a filename or path.",
        inputSchema: z.object({ filepath: z.string().describe("Filename or path to detect console from") }),
        annotations: READ_ONLY,
    }, async (args) => {
        const { detectConsoleFromPath } = await import("./romdb.js");
        const text = detectConsoleFromPath(args.filepath);
        return { content: [{ type: "text", text }] };
    });
    return server;
}
