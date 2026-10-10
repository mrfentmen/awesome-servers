export declare class VercelError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjects(limit?: string): Promise<string>;
export declare function getProject(projectId: string): Promise<string>;
export declare function listDeployments(projectId?: string, limit?: string): Promise<string>;
export declare function deploymentDetails(deployId: string): Promise<string>;
export declare function listAliases(limit?: string): Promise<string>;
export declare function listDomains(): Promise<string>;
export declare function domainInfo(domain: string): Promise<string>;
export declare function listTeams(): Promise<string>;
export declare function projectEnv(projectId: string): Promise<string>;
export declare function getAlias(alias: string): Promise<string>;
/**
 * Where Vercel's network actually is, and which of those places has been in
 * trouble. The status page names every region individually, so this reads the
 * region list, groups it by country, and counts how often each region has been
 * named in a declared incident. No token needed.
 */
export declare function edgeFootprint(args: {
    limit?: number;
}): Promise<string>;
/**
 * Vercel's incident record read as a timeline: what broke, how long it lasted,
 * which products and regions it touched, what the last update said, and the
 * maintenance it has scheduled. No token needed.
 */
export declare function incidentTimeline(args: {
    impact?: string;
    limit?: number;
}): Promise<string>;
