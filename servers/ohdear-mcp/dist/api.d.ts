export declare function errorMessage(e: unknown): string;
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export declare function normalizeTarget(input: string): URL;
export interface HttpHop {
    url: string;
    status: number;
    location: string | null;
}
export interface HttpResult {
    ok: boolean;
    status: number;
    statusText: string;
    finalUrl: string;
    ms: number;
    bytes: number;
    contentType: string;
    server: string | null;
    headers: Record<string, string>;
    hops: HttpHop[];
    bodySnippet: string;
}
/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check an uptime monitor runs, done live.
 */
export declare function request(target: string, timeoutMs?: number): Promise<HttpResult>;
export declare function checkUrl(args: {
    url: string;
}): Promise<string>;
export declare function checkMany(args: {
    urls: string[];
}): Promise<string>;
export interface CertInfo {
    subject: Record<string, string>;
    issuer: Record<string, string>;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    altNames: string[];
    authorized: boolean;
    authorizationError: string | null;
    protocol: string;
}
/** Reads the live certificate off the host's own TLS handshake. */
export declare function fetchCertificate(hostname: string, port?: number): Promise<CertInfo>;
export declare function sslCertificate(args: {
    host: string;
}): Promise<string>;
export declare function dnsHealth(args: {
    domain: string;
}): Promise<string>;
export interface HeaderAudit {
    header: string;
    present: boolean;
    value: string | null;
    why: string;
}
export declare function securityHeaders(args: {
    url: string;
}): Promise<string>;
/** One call that combines the HTTP, TLS, DNS and header checks a monitor would run. */
export declare function siteReport(args: {
    url: string;
}): Promise<string>;
/** The archive's view of the page: when it was last captured, and what it looked like at a point in time. */
export declare function archivedSnapshot(args: {
    url?: string;
    at?: string;
}): Promise<string>;
