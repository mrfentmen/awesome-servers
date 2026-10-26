export declare class SwetrixError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjects(): Promise<string>;
export declare function getProject(projectId: string): Promise<string>;
/** Parse the campaign parameters out of a set of URLs and report what is missing or malformed. */
export declare function campaignParameters(args: {
    urls?: string;
    limit?: number;
}): Promise<string>;
