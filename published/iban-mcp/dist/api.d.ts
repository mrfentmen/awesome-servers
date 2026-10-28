/**
 * IBAN Checker — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function validateIban(a: {
    iban: string;
}): Promise<string>;
export declare function listIbanCountries(a: {
    search?: string;
}): Promise<string>;
