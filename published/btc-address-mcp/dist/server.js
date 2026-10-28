import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { derivationPathInfo, listAddressTypes, validateBtcAddress, SourceError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof SourceError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
export function createServer() {
    const server = new McpServer({ name: "btc-address-mcp", version: "1.0.0" });
    server.tool("validate_btc_address", "Check an address's checksum and shape: P2PKH, P2SH, P2WPKH, P2WSH or P2TR, with network and hash.", {
        address: z.string().describe('Bitcoin address to check')
    }, async (a) => {
        try {
            return text(await validateBtcAddress(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("derivation_path_info", "Explain a BIP-32 derivation path level by level, including the purpose presets and hardened flags.", {
        path: z.string().describe("Path such as m/84'/0'/0'/0/1")
    }, async (a) => {
        try {
            return text(await derivationPathInfo(a));
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    server.tool("list_address_types", "The address types this checker recognises, with their prefixes and version bytes.", {
    // no arguments
    }, async (a) => {
        try {
            return text(await listAddressTypes());
        }
        catch (e) {
            return { content: [{ type: "text", text: errorMessage(e) }], isError: true };
        }
    });
    return server;
}
