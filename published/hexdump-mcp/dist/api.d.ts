/**
 * Hex Dump — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function bullet(label: string, value: unknown): string;
export declare function hexDump(a: {
    data: string;
    format?: string;
    width?: number;
    offset?: number;
}): Promise<string>;
export declare function convertBytes(a: {
    data: string;
    from?: string;
    to: string;
}): Promise<string>;
export declare function byteStats(a: {
    data: string;
    format?: string;
}): Promise<string>;
