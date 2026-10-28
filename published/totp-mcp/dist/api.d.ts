/**
 * TOTP — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function generateTotp(a: {
    secret: string;
    digits?: number;
    period?: number;
    algorithm?: string;
    at?: string;
}): Promise<string>;
export declare function verifyTotp(a: {
    secret: string;
    code: string;
    digits?: number;
    period?: number;
    algorithm?: string;
    window?: number;
}): Promise<string>;
export declare function generateSecret(a: {
    length?: number;
    account?: string;
    issuer?: string;
    digits?: number;
    period?: number;
}): Promise<string>;
