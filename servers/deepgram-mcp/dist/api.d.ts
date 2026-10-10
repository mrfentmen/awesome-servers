export declare class DeepgramError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProjects(): Promise<string>;
export declare function getBalance(projectId: string): Promise<string>;
export declare function listKeys(projectId: string): Promise<string>;
export interface RequestLogArgs {
    project_id: string;
    start?: string;
    end?: string;
    limit?: number;
    page?: number;
    endpoint?: string;
    method?: string;
    status?: string;
    deployment?: string;
}
/** Every request a Deepgram project has made, with the cost, audio handled and failures that are easy to miss in a bill. */
export declare function requestLog(args: RequestLogArgs): Promise<string>;
export interface UsageBreakdownArgs {
    project_id: string;
    grouping?: string;
    start?: string;
    end?: string;
}
/** Usage grouped by whatever dimension you pick, which is how you find which model, tag or feature is burning the budget. */
export declare function usageBreakdown(args: UsageBreakdownArgs): Promise<string>;
export interface ProjectMembersArgs {
    project_id: string;
}
/** Who has access to a Deepgram project and with which scopes, which is the access-control check for a shared project. */
export declare function projectMembers(args: ProjectMembersArgs): Promise<string>;
