export declare class GithubError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function me(): Promise<string>;
export declare function listRepos(limit?: string): Promise<string>;
export declare function getRepo(owner: string, repo: string): Promise<string>;
export declare function searchRepos(query: string, limit?: string): Promise<string>;
export declare function userIssues(): Promise<string>;
export declare function repoIssues(owner: string, repo: string): Promise<string>;
export declare function repoPulls(owner: string, repo: string): Promise<string>;
export declare function repoCommits(owner: string, repo: string): Promise<string>;
export declare function getUser(username: string): Promise<string>;
export declare function searchCode(query: string): Promise<string>;
export declare function listWorkflows(owner: string, repo: string): Promise<string>;
export declare function repoReleases(args: {
    owner: string;
    repo: string;
    limit?: string;
}): Promise<string>;
export declare function repoContributors(args: {
    owner: string;
    repo: string;
    limit?: string;
}): Promise<string>;
