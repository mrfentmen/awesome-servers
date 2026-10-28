/**
 * HTTP Check — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function checkUrl(a: {
    url: string;
    method?: string;
}): Promise<string>;
export declare function checkRedirects(a: {
    url: string;
    maxHops?: number;
}): Promise<string>;
export declare function checkHeaders(a: {
    url: string;
}): Promise<string>;
