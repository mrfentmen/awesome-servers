export declare class PosthogError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function me(): Promise<string>;
export declare function listProjects(): Promise<string>;
export declare function listInsights(projectId: string): Promise<string>;
export declare function insightDetails(projectId: string, insightId: string): Promise<string>;
export declare function dashboards(projectId: string): Promise<string>;
export declare function actions(projectId: string): Promise<string>;
export declare function events(projectId: string, limit?: string): Promise<string>;
export declare function persons(projectId: string): Promise<string>;
export declare function flags(projectId: string): Promise<string>;
export declare function cohorts(projectId: string): Promise<string>;
/**
 * What the public certificate transparency log says about a domain: how many
 * names have ever been certified, which authorities issued them and when. This
 * is the list of hosts a product is actually reachable on, including the ones
 * nobody remembers shipping.
 */
export declare function certificateTransparency(args: {
    domain: string;
    limit?: number;
}): Promise<string>;
/**
 * Whether the page a product serves is valid HTML, broken down by error type,
 * with the messages themselves. A tracking snippet that silently breaks the
    * document is invisible from analytics and obvious here.
 */
export declare function markupAudit(args: {
    url: string;
    limit?: number;
}): Promise<string>;
