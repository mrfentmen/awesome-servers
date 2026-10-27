export declare const DEFAULT_GHOST = "gopher.floodgap.com";
export declare const DEFAULT_PORT = 70;
export declare class GopherError extends Error {
}
export interface GopherItem {
    type: string;
    label: string;
    selector: string;
    host: string;
    port: number;
    info?: boolean;
    error?: boolean;
}
/**
 * Open a gopher connection, send `selector`, and read the full response.
 * Returns the raw body with the trailing ".\r\n" terminator removed.
 */
export declare function gopherFetch(host: string, selector: string, port?: number, timeoutMs?: number): Promise<string>;
/** Drop the gopher trailing terminator line (".") and CRLF noise. */
export declare function stripTerminator(body: string): string;
/**
 * Parse a raw gopher response into structured items (menu mode).
 * `requestHost` is used as the fallback for items whose host field is
 * empty (RFC 1436: empty host means the same host we queried).
 */
export declare function parseMenu(body: string, requestHost?: string): GopherItem[];
/** Drop the gopher trailing "." and CRLF noise for plain-text reads. */
export declare function cleanText(body: string): string;
export declare function formatItem(it: GopherItem, index: number): string;
