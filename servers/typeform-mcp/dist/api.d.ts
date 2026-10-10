export declare class TypeformError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listForms(): Promise<string>;
export declare function getForm(formId: string): Promise<string>;
export declare function listResponses(formId: string): Promise<string>;
export declare function findResponse(formId: string, responseId: string): Promise<string>;
export declare function accountImages(): Promise<string>;
export declare function accountImage(imageId: string): Promise<string>;
export declare function createForm(title: string): Promise<string>;
export declare function themes(): Promise<string>;
export declare function themeDetails(themeId: string): Promise<string>;
export declare function workspaces(): Promise<string>;
/**
 * Whether Typeform itself is up: 36 published components with their state, plus
 * the incidents that hit each of them and how long the worst ones lasted. Worth
 * reading before concluding that a form's low completion rate is a design problem.
 */
export declare function serviceStatus(args: {
    limit?: number;
}): Promise<string>;
/**
 * A form-design linter. It reads a Typeform schema the caller already has and
 * reports the design faults that quietly ruin a survey: a required field with no
 * way out, a long list of choices rendered as buttons, a rating scale with no
 * neutral step, duplicated question text, missing refs, and a page that will
 * overflow. Pure local logic, no network call and nothing invented.
 */
export declare function schemaLint(args: {
    schema: string;
    pages?: number;
}): Promise<string>;
