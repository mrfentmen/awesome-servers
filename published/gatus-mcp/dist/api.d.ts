export declare function errorMessage(e: unknown): string;
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export declare function normalizeTarget(input: string): URL;
/**
 * Evaluates the conditions a health dashboard would attach to an endpoint:
 * the status it must return, a latency budget, and text the body must contain.
 */
export declare function checkEndpoint(args: {
    url: string;
    expectedStatus?: number;
    maxMs?: number;
    bodyContains?: string;
}): Promise<string>;
/** Health rollup across several endpoints, judged against the status each should return. */
export declare function healthRollup(args: {
    urls: string[];
    expectedStatus?: number;
    maxMs?: number;
}): Promise<string>;
export declare function endpointLatency(args: {
    url: string;
    samples?: number;
}): Promise<string>;
export declare function tlsExpiry(args: {
    host: string;
}): Promise<string>;
export declare function dnsRecords(args: {
    domain: string;
    type?: string;
}): Promise<string>;
export declare function securityHeaders(args: {
    url: string;
}): Promise<string>;
export declare function payloadReport(args: {
    url: string;
}): Promise<string>;
export declare function allowedMethods(args: {
    url: string;
}): Promise<string>;
export declare function healthPathProbe(args: {
    host: string;
    paths?: string;
}): Promise<string>;
export declare function resolverAgreement(args: {
    domain: string;
    type?: string;
}): Promise<string>;
export declare function tcpPortCheck(args: {
    host: string;
    ports?: number[];
    timeout_ms?: number;
}): Promise<string>;
