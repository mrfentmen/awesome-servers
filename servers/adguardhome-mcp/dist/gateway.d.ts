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
/** Raised when a premium call cannot be completed. `message` is safe to show. */
export declare class GatewayError extends Error {
    readonly refused: boolean;
    constructor(message: string, refused: boolean);
}
export declare function premiumTool(tool: string, args: Record<string, unknown>): Promise<string>;
