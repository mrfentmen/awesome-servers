export declare class InfisicalError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listSecrets(projectId: string, environment?: string, secretPath?: string): Promise<string>;
export declare function getSecret(projectId: string, key: string, environment?: string, secretPath?: string): Promise<string>;
export declare function createSecret(projectId: string, key: string, value: string, environment?: string, secretPath?: string): Promise<string>;
export declare function updateSecret(projectId: string, key: string, value: string, environment?: string, secretPath?: string): Promise<string>;
export declare function deleteSecret(projectId: string, key: string, environment?: string, secretPath?: string): Promise<string>;
export interface InfisicalEntropyArgs {
    secrets: string;
    label?: string;
}
export interface InfisicalNamesArgs {
    names: string;
    style?: string;
}
export declare function secretNameHygiene(args: InfisicalNamesArgs): Promise<string>;
export interface InfisicalDiffArgs {
    left: string;
    right: string;
    left_label?: string;
    right_label?: string;
}
