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
/**
 * The same URL, requested from several countries at once. A single vantage point
 * cannot tell you that a site is down only in Europe or only in Asia, and that is
 * exactly the failure a monitor misses when it watches from one place.
 */
export declare function multiRegionCheck(args: {
    url: string;
    nodes?: number;
}): Promise<string>;
/**
 * How UptimeRobot's own service has been behaving, from its public status board:
 * every monitor it publishes, its uptime ratio over the whole window and over 30
 * and 90 days, and the days it was not at full availability.
 */
export declare function vendorUptime(args: {
    limit?: number;
}): Promise<string>;
