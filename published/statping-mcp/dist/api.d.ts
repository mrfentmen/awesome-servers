export declare function errorMessage(e: unknown): string;
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export declare function normalizeTarget(input: string): URL;
export declare function serviceStatus(args: {
    url: string;
}): Promise<string>;
export declare function checkServices(args: {
    urls: string[];
}): Promise<string>;
export declare function portCheck(args: {
    host: string;
    ports?: number[];
}): Promise<string>;
export declare function dnsPropagation(args: {
    domain: string;
    type?: string;
}): Promise<string>;
export declare function sslChain(args: {
    host: string;
}): Promise<string>;
/** The rollup a status page shows: which services are up, which are down, and the overall state. */
export declare function statusSummary(args: {
    urls: string[];
}): Promise<string>;
export interface RecordsArgs {
    domain: string;
    types?: string;
}
export declare function dns_records(args: RecordsArgs): Promise<string>;
export interface CertForecastArgs {
    host: string;
    port?: number;
    warnDays?: number;
}
export declare function cert_forecast(args: CertForecastArgs): Promise<string>;
