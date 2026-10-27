export declare function errorMessage(e: unknown): string;
export declare function searchProjects(args: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function projectIssues(args: {
    project: string;
    state?: string;
    labels?: string;
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function issueDetail(args: {
    project: string;
    iid: number;
}): Promise<string>;
export declare function mergeRequests(args: {
    project: string;
    state?: string;
    limit?: number;
}): Promise<string>;
/** Cross-project issue view for a whole GitLab group, which mirrors a team's board. */
export declare function groupIssues(args: {
    group: string;
    state?: string;
    labels?: string;
    limit?: number;
}): Promise<string>;
export declare function issueStats(args: {
    project: string;
    days?: number;
}): Promise<string>;
export declare function recentIssues(args: {
    project: string;
    limit?: number;
}): Promise<string>;
/**
 * The public project registry: what software is actually built and maintained on
 * GitLab, how large its community is and how recently it moved. A tracker is only
 * as good as the projects that live in it, and this is how you see that before
 * creating an account.
 */
export declare function publicRegistry(args: {
    scope?: string;
    search?: string;
    limit?: number;
}): Promise<string>;
/**
 * What the platform itself has been doing lately, from JetBrains' own public
 * feed: the posts, their dates and categories. Tracker releases and deprecations
 * are announced there first, and reading them is how you find out a version you
 * depend on is being retired.
 */
export declare function platformFeed(args: {
    limit?: number;
}): Promise<string>;
