/**
 * iCalendar — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function parseIcal(a: {
    text: string;
    limit?: number;
}): Promise<string>;
export declare function createEvent(a: {
    summary: string;
    start: string;
    end?: string;
    location?: string;
    description?: string;
    uid?: string;
}): Promise<string>;
export declare function validateIcal(a: {
    text: string;
}): Promise<string>;
