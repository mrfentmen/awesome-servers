export declare function errorMessage(e: unknown): string;
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export declare function normalizeTarget(input: string): URL;
export declare function checkUrl(args: {
    url: string;
}): Promise<string>;
export declare function checkEndpoints(args: {
    urls: string[];
}): Promise<string>;
export declare function portMonitor(args: {
    host: string;
    ports?: number[];
}): Promise<string>;
export declare function sslExpiry(args: {
    host: string;
}): Promise<string>;
export declare function dnsHealth(args: {
    domain: string;
}): Promise<string>;
/** One call that combines the HTTP, TLS and DNS checks a monitor would run. */
export declare function monitorReport(args: {
    url: string;
}): Promise<string>;
