/**
 * Base58 — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function base58Encode(a: {
    data: string;
    format?: string;
    check?: boolean;
    version?: string;
}): Promise<string>;
export declare function base58Decode(a: {
    text: string;
    check?: boolean;
}): Promise<string>;
export declare function base58AlphabetInfo(): Promise<string>;
