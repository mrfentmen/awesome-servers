export declare class RollbarError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjects(): Promise<string>;
export declare function listItems(projectId: string): Promise<string>;
export declare function getItem(projectId: string, itemId: string): Promise<string>;
/**
 * Is a package version affected by anything OSV knows about, with the CVE each
 * advisory aliases and the exact range that covers the version.
 */
export declare function dependencyAudit(args: {
    package: string;
    ecosystem: string;
    version?: string;
    limit?: number;
}): Promise<string>;
/**
 * One advisory in full: its description, severity vector, the packages and
 * version ranges it covers, and the references to read about it. This is what
 * goes in the incident write-up.
 */
export declare function advisoryDetail(args: {
    id: string;
}): Promise<string>;
