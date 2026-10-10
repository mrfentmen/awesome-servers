export declare class PusherError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listChannels(prefix?: string, limit?: string): Promise<string>;
export declare function getChannel(channel: string): Promise<string>;
export declare function getChannelUsers(channel: string): Promise<string>;
/**
 * Open a real websocket and measure it: handshake time, round-trip time across
 * several payloads, and the size limits the transport will actually carry. This
 * is the baseline a Pusher channel has to beat.
 */
export declare function websocketRoundTrip(args: {
    payload_kb?: number;
    samples?: number;
    url?: string;
}): Promise<string>;
/**
 * How a websocket handles the awkward payloads: a large frame, a frame full of
 * multi-byte characters, and a frame carrying an empty body. Realtime products
 * break on exactly these three.
 */
export declare function websocketPayloadProbe(args: {
    url?: string;
    large_kb?: number;
}): Promise<string>;
