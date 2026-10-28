/**
 * Password Tools — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function generatePassword(a: {
    length?: number;
    upper?: boolean;
    digits?: boolean;
    symbols?: boolean;
    excludeAmbiguous?: boolean;
}): Promise<string>;
export declare function generatePassphrase(a: {
    words?: number;
    separator?: string;
    capitalise?: boolean;
}): Promise<string>;
export declare function checkPasswordStrength(a: {
    password: string;
}): Promise<string>;
export declare function listPasswordWords(a: {
    search?: string;
}): Promise<string>;
