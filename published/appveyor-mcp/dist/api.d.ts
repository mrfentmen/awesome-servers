export declare function errorMessage(e: unknown): string;
export declare function projectPipelines(args: {
    project: string;
    ref?: string;
    limit?: number;
}): Promise<string>;
export declare function pipelineDetail(args: {
    project: string;
    pipelineId: number;
}): Promise<string>;
export declare function pipelineJobs(args: {
    project: string;
    pipelineId: number;
    limit?: number;
}): Promise<string>;
export declare function ciStats(args: {
    project: string;
    limit?: number;
}): Promise<string>;
export declare function latestCiStatus(args: {
    projects: string[];
}): Promise<string>;
export declare function githubWorkflowRuns(args: {
    repo: string;
    branch?: string;
    limit?: number;
}): Promise<string>;
export declare function githubJobs(args: {
    repo: string;
    runId: number;
}): Promise<string>;
export declare function projectReleases(args: {
    project: string;
    limit?: number;
}): Promise<string>;
export declare function repoLanguages(args: {
    repo: string;
}): Promise<string>;
