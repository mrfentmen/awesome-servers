/**
 * Endian & Integers — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function swapEndian(a: {
    value: string;
    bits: number;
}): Promise<string>;
export declare function interpretBytes(a: {
    data: string;
    format?: string;
    offset?: number;
}): Promise<string>;
export declare function intInfo(a: {
    value: string;
    bits?: number;
}): Promise<string>;
