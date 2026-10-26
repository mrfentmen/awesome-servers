export declare class CensysError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getHost(ip: string): Promise<string>;
export declare function searchHosts(query: string, perPage?: string): Promise<string>;
export interface AggregateArgs {
    field: string;
    query: string;
    buckets?: number;
}
/**
 * GET /hosts/aggregate - buckets one field across every host matching a query.
 * Buckets come back as { key, count }, with total, total_omitted and
 * potential_deviation alongside.
 */
export declare function hostAggregate(args: AggregateArgs): Promise<string>;
export interface CertSearchArgs {
    query: string;
    limit?: number;
}
/** Search the certificate index: who issued what, for which names, and how long it is valid. */
export declare function searchCertificates(args: CertSearchArgs): Promise<string>;
export interface ExposureArgs {
    fingerprint: string;
    limit?: number;
}
/** Which hosts present one certificate: the exposure surface behind a fingerprint. */
export declare function certificateExposure(args: ExposureArgs): Promise<string>;
