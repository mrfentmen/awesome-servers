import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { certInfo } from "./api.js";
import { premiumTool } from "./gateway.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ssl-cert-mcp", version: "1.0.0" });
    server.registerTool("cert_info", {
        title: "Cert info",
        description: "Get TLS certificate details for a host.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), port: z.number().describe("Port, default 443.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await certInfo(args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("tls_details", {
        title: "TLS details",
        description: "The protocol version and cipher suite a host negotiates, plus whether Node trusted its certificate against the local store.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), port: z.number().describe("Port, default 443.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: tls_details ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_ssl_cert_tls_details", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    server.registerTool("cert_expiry", {
        title: "Cert expiry",
        description: "How long a host's certificate has left, whether it has already expired, its total lifetime and SHA-256 fingerprint.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), port: z.number().describe("Port, default 443.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // ---- paywall: cert_expiry ----
        // The body runs on the gateway, behind the licence gate.
        // ---- paywall: end ----
        try {
            return text(await premiumTool("mcp_ssl_cert_cert_expiry", args));
        }
        catch (e) {
            return textError(error(e));
        }
    });
    return server;
}
