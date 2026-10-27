export declare class FormbricksError extends Error {
}
export interface Survey {
    id: string;
    name?: string;
    status?: string;
    responses?: number;
}
export declare function listSurveys(limit?: number): Promise<Survey[]>;
export declare function surveyResponses(id: string, limit?: number): Promise<string[]>;
export declare function formatSurvey(s: Survey, index?: number): string;
