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
