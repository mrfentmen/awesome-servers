import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hashFile, hashText, verifyChecksum, directoryManifest, hmacDigest, npmIntegrity } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "checksum-mcp", version: "1.0.0" });
    server.registerTool("hash_text", {
        title: "Hash text",
        description: "Hash a string with a chosen algorithm.",
        inputSchema: z.object({ text: z.string().describe("Text to hash."), algorithm: z.string().describe("sha256, sha1, or md5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hashText(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("hash_file", {
        title: "Hash file",
        description: "Hash a local file.",
        inputSchema: z.object({ path: z.string().describe("Path to the file."), algorithm: z.string().describe("sha256, sha1, or md5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hashFile(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("verify_checksum", {
        title: "Verify checksum",
        description: "Check a file or string against an expected digest and report MATCH or MISMATCH, accepting either a bare hex value or an algorithm-prefixed digest.",
        inputSchema: z.object({ path: z.string().describe("File to verify.").optional(), text: z.string().describe("String to verify.").optional(), expected: z.string().describe("Expected digest, bare hex or algo:hex."), algorithm: z.string().describe("sha256, sha512, sha1 or md5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await verifyChecksum(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("directory_manifest", {
        title: "Directory manifest",
        description: "Hash every file in a directory, list each path with its size and digest, and return a single digest over the sorted manifest so a tree can be verified later.",
        inputSchema: z.object({ path: z.string().describe("Directory to walk."), algorithm: z.string().describe("sha256, sha512, sha1 or md5.").optional(), limit: z.number().describe("Max files listed.").optional(), exclude: z.string().describe("Skip paths containing this text, e.g. node_modules.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await directoryManifest(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("hmac_digest", {
        title: "HMAC digest",
        description: "Keyed HMAC of a message using sha256, sha512, sha1 or md5, in hex or base64, for webhook and API signature verification.",
        inputSchema: z.object({ message: z.string().describe("Message to authenticate."), key: z.string().describe("Shared secret."), encoding: z.string().describe("hex or base64.").optional(), algorithm: z.string().describe("sha256, sha512, sha1 or md5.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await hmacDigest(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("npm_integrity", {
        title: "npm package integrity",
        description: "Read the npm registry's current tarball integrity, legacy shasum and tarball URL for a package.",
        inputSchema: z.object({ package: z.string().describe("npm package name; defaults to typescript.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await npmIntegrity(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "checksum-mcp";
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
