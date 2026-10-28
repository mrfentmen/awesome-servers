export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function stockQuote(a: {
    symbol: string;
}): Promise<string>;
export declare function stockHistory(a: {
    symbol: string;
    limit?: number;
}): Promise<string>;
export declare function topStocks(a: {
    limit?: number;
    offset?: number;
}): Promise<string>;
