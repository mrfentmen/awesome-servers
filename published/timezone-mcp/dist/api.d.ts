/**
 * Time Zones — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function timeInZone(a: {
    zone: string;
    at?: string;
}): Promise<string>;
export declare function convertTime(a: {
    time: string;
    from: string;
    to: string;
}): Promise<string>;
export declare function listTimezones(a: {
    search?: string;
}): Promise<string>;
