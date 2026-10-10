export declare class LinearError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function me(): Promise<string>;
export declare function listTeams(): Promise<string>;
export declare function searchIssues(term: string, limit?: string): Promise<string>;
export declare function getIssue(issueId: string): Promise<string>;
export declare function teamIssues(teamId: string, limit?: string): Promise<string>;
export declare function listProjects(): Promise<string>;
export declare function myIssues(limit?: string): Promise<string>;
export declare function listLabels(teamId: string): Promise<string>;
export declare function createIssue(teamId: string, title: string, description?: string): Promise<string>;
export declare function updateIssueTitle(issueId: string, title: string): Promise<string>;
/** How much a package is actually used, and how recently it shipped: the adoption signal a tracker cannot see. */
export declare function packageAdoption(args: {
    package: string;
}): Promise<string>;
/** The OpenSSF scorecard for a repository: an aggregate supply-chain score and the checks behind it. */
export declare function projectScorecard(args: {
    repo: string;
    limit?: number;
}): Promise<string>;
