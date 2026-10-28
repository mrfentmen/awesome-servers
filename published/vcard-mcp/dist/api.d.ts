/**
 * vCard — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function parseVcard(a: {
    text: string;
    limit?: number;
}): Promise<string>;
export declare function vcardToJson(a: {
    text: string;
    limit?: number;
}): Promise<string>;
export declare function createVcard(a: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    org?: string;
    title?: string;
    phones?: string;
    emails?: string;
    url?: string;
    note?: string;
}): Promise<string>;
