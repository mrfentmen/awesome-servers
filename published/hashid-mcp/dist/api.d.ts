/**
 * Hash Identifier — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function identifyHash(a: {
    text: string;
}): Promise<string>;
export declare function hashLengths(): Promise<string>;
export declare function hashDetails(a: {
    text: string;
}): Promise<string>;
