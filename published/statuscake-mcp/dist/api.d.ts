export declare function errorMessage(e: unknown): string;
export declare function normalizeTarget(input: string): URL;
export declare function checkUrl(args: {
    url: string;
}): Promise<string>;
export declare function portCheck(args: {
    host: string;
    ports?: number[];
}): Promise<string>;
export interface ChainCert {
    depth: number;
    subject: string;
    issuer: string;
    validTo: string;
    daysRemaining: number;
    altNames: string[];
}
export declare function sslChain(args: {
    host: string;
}): Promise<string>;
export declare function dnsPropagation(args: {
    domain: string;
    type?: string;
}): Promise<string>;
/** One call that runs every check a monitoring service would run on a host. */
export declare function uptimeReport(args: {
    url: string;
}): Promise<string>;
export interface RecordsArgs {
    domain: string;
    types?: string;
}
export declare function dns_records(args: RecordsArgs): Promise<string>;
export interface TimingArgs {
    url: string;
    repeats?: number;
}
export declare function http_timing(args: TimingArgs): Promise<string>;
