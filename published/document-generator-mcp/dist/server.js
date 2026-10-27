import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createDoc } from "./local-api.js";
import { createReport, createTableDocument, createMarkdownDocument, extractDocxText } from "./local-api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const WRITE = { readOnlyHint: false, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "document-generator-mcp", version: "1.0.0" });
    server.registerTool("create_doc", {
        title: "Create doc",
        description: "Create a Word document with a title and paragraphs.",
        inputSchema: z.object({ title: z.string().describe("Document title."), body: z.string().describe("Body paragraphs separated by blank lines."), filename: z.string().describe("Output file name.").optional() }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await createDoc(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_report", {
        title: "Create report",
        description: "Create a Word report with headings and bullet lines.",
        inputSchema: z.object({ title: z.string().describe("Report title."), bullets: z.string().describe("Comma separated bullet lines.").optional() }),
        annotations: WRITE,
    }, async (args) => {
        try {
            return text(await createReport(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("create_table_document", {
        title: "Create table document",
        description: "Turn CSV text into a Word document containing a real bordered table with an optional shaded header row, written to the system temp directory.",
        inputSchema: z.object({ title: z.string().describe("Document title.").optional(), csv: z.string().describe("CSV text including a header row."), filename: z.string().describe("Output filename.").optional(), has_header: z.boolean().describe("First row is a header.").optional(), max_rows: z.number().describe("Max data rows.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await createTableDocument(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("create_markdown_document", {
        title: "Create markdown document",
        description: "Render markdown into a structured Word document with real heading levels, bulleted and numbered lists, block quotes, inline bold, italics, monospace and fenced code blocks.",
        inputSchema: z.object({ markdown: z.string().describe("Markdown source."), title: z.string().describe("Document title.").optional(), filename: z.string().describe("Output filename.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await createMarkdownDocument(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("extract_docx_text", {
        title: "Extract docx text",
        description: "Read a .docx file and return its text content by unpacking word/document.xml, useful for verifying or reading a generated document.",
        inputSchema: z.object({ path: z.string().describe("Path to a .docx file."), max_chars: z.number().describe("Max characters to return.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await extractDocxText(args));
        }
        catch (e) {
            return textError(e instanceof Error ? `Error: ${e.message}` : String(e));
        }
    });
    server.registerTool("doi_citation", {
        title: "Doi citation",
        description: "Retrieve authoritative Crossref bibliographic metadata for a DOI as a citation block for a document. Includes authors, publication date, journal, pages and DOI link; defaults to 10.1038/nphys1170.",
        inputSchema: z.object({ doi: z.string().max(250).optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement citation locally (paywall removed)
        try {
            return textError("Not yet implemented: citation");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "document-generator-mcp";
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
