export declare class AshbyError extends Error {
}
export interface Job {
    id: string;
    title?: string;
    department?: string;
    location?: string;
    type?: string;
    url?: string;
}
export declare function listJobs(org: string, limit?: number): Promise<Job[]>;
export declare function formatJob(j: Job, index?: number): string;
export declare function searchJobs(org: string, query: string, limit?: number): Promise<string>;
export declare function getJob(org: string, jobId: string): Promise<string>;
export declare function departments(org: string): Promise<string>;
export declare function remoteJobs(org: string, limit?: number): Promise<string>;
export declare function compensation(org: string, limit?: number): Promise<string>;
/** Sub-teams listed on the roles, finer-grained than the department roll-up. */
export declare function listTeams(org: string): Promise<string>;
/** Every location a board hires into, including secondary locations. */
export declare function listLocations(org: string): Promise<string>;
/** Open roles sorted by their publish date, newest first. */
export declare function newestJobs(org: string, limit?: number): Promise<string>;
