export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function deals(a: {
    storeID?: string;
    upperPrice?: number;
    limit?: number;
}): Promise<string>;
export declare function stores(a: Record<string, never>): Promise<string>;
export declare function game_search(a: {
    title: string;
    limit?: number;
}): Promise<string>;
export declare function game_prices(a: {
    gameID: string;
}): Promise<string>;
export declare function store_deals(a: {
    storeID: string;
    limit?: number;
}): Promise<string>;
