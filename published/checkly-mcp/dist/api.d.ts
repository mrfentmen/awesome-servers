export declare function errorMessage(e: unknown): string;
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export declare function normalizeTarget(input: string): URL;
export declare function checkUrl(args: {
    url: string;
}): Promise<string>;
export interface Assertion {
    name: string;
    passed: boolean;
    detail: string;
}
export declare function assertStatus(args: {
    url: string;
    expected: string;
    method?: string;
}): Promise<string>;
export declare function assertHeaders(args: {
    url: string;
    required?: string[];
    forbidden?: string[];
    header?: string;
    contains?: string;
}): Promise<string>;
export declare function assertContent(args: {
    url: string;
    contains?: string[];
    notContains?: string[];
}): Promise<string>;
export declare function checkRedirects(args: {
    url: string;
}): Promise<string>;
export declare function brokenLinks(args: {
    url: string;
    limit?: number;
}): Promise<string>;
export declare function assertResponseTime(args: {
    url: string;
    budget_ms?: number;
    samples?: number;
}): Promise<string>;
export declare function assertJson(args: {
    url: string;
    path?: string;
    equals?: string;
    contains?: string;
}): Promise<string>;
export declare function assertRedirect(args: {
    url: string;
    location_contains?: string;
    status?: string;
}): Promise<string>;
export interface HttpSecurityArgs {
    url: string;
    method?: string;
}
export interface A11yArgs {
    url: string;
    max_images?: number;
}
/** The machine-checkable slice of accessibility: language, heading order, alt text, zoom, landmarks. */
export declare function a11yBasics(args: A11yArgs): Promise<string>;
export interface SeoArgs {
    url: string;
    min_title?: number;
    max_title?: number;
}
