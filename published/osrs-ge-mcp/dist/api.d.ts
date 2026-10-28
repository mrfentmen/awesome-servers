export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function itemSearch(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function itemPrice(a: {
    item: string | number;
}): Promise<string>;
export declare function priceHistory(a: {
    item: string | number;
    timestep?: string;
    limit?: number;
}): Promise<string>;
