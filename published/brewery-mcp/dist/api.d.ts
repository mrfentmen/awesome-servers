export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function searchBreweries(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function listBreweries(a: {
    city?: string;
    state?: string;
    type?: string;
    limit?: number;
    page?: number;
}): Promise<string>;
export declare function breweryDetail(a: {
    id: string;
}): Promise<string>;
