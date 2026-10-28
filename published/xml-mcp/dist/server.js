import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseXmlFile, validateXml, xmlToJson, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "xml-mcp", version: "1.0.0" });
    server.tool("parse_xml", "Parse XML and show the element tree with attributes and text, failing with line numbers when it is not well-formed.", {
        text: z.string().describe('XML text')
    }, async (a) => {
        try {
            return text(await parseXmlFile(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("xml_to_json", "Convert a single-root XML document to JSON: attributes become @name, text becomes #text, repeated tags become arrays.", {
        text: z.string().describe('XML text with one root element')
    }, async (a) => {
        try {
            return text(await xmlToJson(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("validate_xml", "Check XML for well-formedness problems: mismatched or unclosed tags, bad entities, stray text, multiple roots.", {
        text: z.string().describe('XML text')
    }, async (a) => {
        try {
            return text(await validateXml(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
