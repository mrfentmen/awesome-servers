export declare class UsajobsError extends Error {
}
export interface FedJob {
    title?: string;
    agency?: string;
    locations: string[];
    pay?: string;
    grade?: string;
    posted?: string;
    closes?: string;
    url?: string;
}
export declare function searchJobs(keyword: string, location?: string, limit?: number): Promise<{
    total: number;
    jobs: FedJob[];
}>;
export declare function formatJob(j: FedJob, index?: number): string;
/**
 * The federal employment rules themselves, as published: which document, which
 * agency, what type of rule, when it took effect and what it says. These are the
 * documents that decide who is eligible for a federal post, so a job search that
 * finds an opening says nothing about whether the reader qualifies for it.
 */
export declare function hiringRules(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
/**
 * The shape of federal employment activity over time rather than any one document:
 * how many hiring-related rules were published each year, which agency filed them,
 * what kind of rule they were, and which have actually taken effect. A trend is
 * what tells you a policy is moving, and a single search result cannot.
 */
export declare function hiringSignal(args: {
    query?: string;
    years?: number;
}): Promise<string>;
