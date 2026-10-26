export declare class OpenpanelError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getMetrics(projectId: string, startDate?: string, endDate?: string): Promise<string>;
export declare function getLive(projectId: string): Promise<string>;
export declare function getPages(projectId: string): Promise<string>;
export declare function getReferrer(projectId: string): Promise<string>;
/** Classify a list of referrers the way a traffic report has to before it can be read. */
export declare function referrerTaxonomy(args: {
    referrers?: string;
    limit?: number;
}): Promise<string>;
