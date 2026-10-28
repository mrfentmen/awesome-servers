import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkExpiry, decodePem, tlsCertificate, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "x509-mcp", version: "1.0.0" });
    server.tool("decode_pem", "Decode one or more PEM certificates: subject, issuer, serial, validity window, key type, SANs, usage and SHA-256 fingerprint.", {
        pem: z.string().describe('PEM text with one or more -----BEGIN CERTIFICATE----- blocks')
    }, async (a) => {
        try {
            return text(await decodePem(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("check_expiry", "Report days left and expiry state for every certificate in a PEM bundle.", {
        pem: z.string().describe('PEM text with one or more certificates')
    }, async (a) => {
        try {
            return text(await checkExpiry(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("tls_certificate", "Connect to a host over TLS and report the certificate it presents, with chain length and verification result.", {
        host: z.string().describe('Host name, e.g. example.com'), port: z.number().int().min(1).max(65535).optional().describe('Port, default 443')
    }, async (a) => {
        try {
            return text(await tlsCertificate(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
