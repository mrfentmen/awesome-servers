/**
 * Checksums — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function crc32(a: {
    data: string;
    format?: string;
    variant?: string;
}): Promise<string>;
export declare function crc16(a: {
    data: string;
    format?: string;
    variant?: string;
}): Promise<string>;
export declare function checksumAll(a: {
    data: string;
    format?: string;
}): Promise<string>;
