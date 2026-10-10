export declare function errorMessage(e: unknown): string;
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export declare function normalizeTarget(input: string): URL;
export declare function responseTimes(args: {
    url: string;
    samples?: number;
}): Promise<string>;
export declare function latencyBreakdown(args: {
    url: string;
}): Promise<string>;
export declare function contentCheck(args: {
    url: string;
}): Promise<string>;
export declare function redirectChain(args: {
    url: string;
}): Promise<string>;
export declare function headersReport(args: {
    url: string;
}): Promise<string>;
/** One call combining reachability, latency, TLS and DNS for a single endpoint. */
export declare function endpointSummary(args: {
    url: string;
}): Promise<string>;
export declare function certificateInfo(args: {
    url: string;
}): Promise<string>;
export declare function dnsRecords(args: {
    domain: string;
}): Promise<string>;
export declare function portCheck(args: {
    host: string;
    ports?: string;
}): Promise<string>;
export declare function tlsVersions(args: {
    host: string;
    port?: number;
}): Promise<string>;
export declare function hostNetwork(args: {
    host: string;
}): Promise<string>;
