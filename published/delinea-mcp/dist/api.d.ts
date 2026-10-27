export declare class DelineaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchSecrets(query: string): Promise<string>;
export declare function getSecret(secretId: string): Promise<string>;
export declare function listFolders(): Promise<string>;
