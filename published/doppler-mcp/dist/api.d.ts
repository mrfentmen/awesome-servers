export declare class DopplerError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjects(): Promise<string>;
export declare function listConfigs(project: string): Promise<string>;
export declare function listSecrets(project: string, config: string, secrets?: string): Promise<string>;
export declare function downloadSecrets(project: string, config: string, format?: string): Promise<string>;
export interface ConfigLockArgs {
    project: string;
}
/** Whether each config in a project is locked, which is the control that stops a production secret being edited. */
export declare function configLockStatus(args: ConfigLockArgs): Promise<string>;
export interface InheritableArgs {
    project: string;
    config: string;
    limit?: number;
}
/** Which secrets cascade out of one config into other configs and environments, which is how a dev value reaches production. */
export declare function inheritableSecrets(args: InheritableArgs): Promise<string>;
export interface SecretDiffArgs {
    project: string;
    from_config: string;
    to_config: string;
    limit?: number;
}
/** Compares the secrets of two configs and reports drift, without printing any values. */
export declare function secretDiff(args: SecretDiffArgs): Promise<string>;
