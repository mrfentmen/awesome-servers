export declare class TallyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listForms(): Promise<string>;
export declare function getForm(formId: string): Promise<string>;
export declare function listSubmissions(formId: string, limit?: string): Promise<string>;
export declare function listWebhooks(formId: string): Promise<string>;
export declare function getWebhook(formId: string, webhookId: string): Promise<string>;
/** Is each question actually answerable, and will people read it before answering? */
export declare function questionQualityAudit(args: {
    input?: string;
}): Promise<string>;
/** Conditional logic is where forms break silently, so check the whole graph. */
export declare function formLogicAudit(args: {
    input?: string;
}): Promise<string>;
/** Expected completion time and the responses you need, with the assumptions stated. */
export declare function completionEstimate(args: {
    input?: string;
    target_responses?: number;
    confidence_pct?: number;
}): Promise<string>;
