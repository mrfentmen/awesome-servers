/**
 * Thin client for the premium gateway.
 *
 * The premium tools do not run in this package any more. Their bodies live on
 * the gateway, which checks a Polar licence key before it does any work, so
 * deleting anything here buys nothing: the answer only exists behind the gate.
 *
 * Set `MCP_LICENSE_KEY` to a Polar licence key. `MCP_GATEWAY_URL` overrides the
 * endpoint, which is only useful for testing.
 */
const DEFAULT_GATEWAY_URL = 'https://mcp-gateway.contactae2000.workers.dev/mcp';
const DEFAULT_TIMEOUT_MS = 25000;
const USER_AGENT = 'mrfentmen-mcp/1.0';
/** Raised when a premium call cannot be completed. `message` is safe to show. */
export class GatewayError extends Error {
    refused;
    constructor(message, refused) {
        super(message);
        this.refused = refused;
        this.name = 'GatewayError';
    }
}
export async function premiumTool(tool, args) {
    const key = (process.env.MCP_LICENSE_KEY ?? '').trim();
    if (!key) {
        throw new GatewayError(`"${tool}" is a premium tool and no licence key is set. Set MCP_LICENSE_KEY in your MCP client config.`, true);
    }
    const url = (process.env.MCP_GATEWAY_URL ?? DEFAULT_GATEWAY_URL).trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                accept: 'application/json',
                'user-agent': USER_AGENT,
                authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: { name: tool, arguments: args },
            }),
            signal: controller.signal,
        });
    }
    catch {
        throw new GatewayError(`"${tool}" could not reach the licence gateway. Check your connection and try again.`, false);
    }
    finally {
        clearTimeout(timer);
    }
    if (!response.ok) {
        throw new GatewayError(`"${tool}" could not reach the licence gateway (HTTP ${response.status}).`, false);
    }
    let body;
    try {
        body = (await response.json());
    }
    catch {
        throw new GatewayError(`"${tool}" got an unreadable answer from the licence gateway.`, false);
    }
    if (body.error) {
        throw new GatewayError(`"${tool}" was refused by the licence gateway: ${body.error.message ?? 'unknown error'}`, false);
    }
    const result = body.result ?? {};
    const text = (result.content ?? [])
        .map((part) => part.text ?? '')
        .join('\n')
        .trim();
    if (result.isError) {
        // The gateway marks a licence refusal structurally, so a missing or rejected
        // key is told apart from a tool that failed after the gate let it through.
        if (result.structuredContent?.licenceRefusal) {
            throw new GatewayError(text || `"${tool}" needs a valid licence key.`, true);
        }
        throw new GatewayError(text || `"${tool}" failed on the licence gateway.`, false);
    }
    if (!text)
        throw new GatewayError(`"${tool}" returned no data.`, false);
    return text;
}
