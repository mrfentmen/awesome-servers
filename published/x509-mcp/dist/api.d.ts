/**
 * X.509 Certificates — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function decodePem(a: {
    pem: string;
}): Promise<string>;
export declare function checkExpiry(a: {
    pem: string;
}): Promise<string>;
export declare function tlsCertificate(a: {
    host: string;
    port?: number;
}): Promise<string>;
