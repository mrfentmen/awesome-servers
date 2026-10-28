export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function searchEntries(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function entryDetail(a: {
    emdbId: string;
}): Promise<string>;
export declare function entryPdbs(a: {
    emdbId: string;
}): Promise<string>;
