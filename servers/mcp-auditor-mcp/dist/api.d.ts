export declare function errorMessage(e: unknown): string;
export declare function normalizeTarget(input: string): URL;
export declare function probeKeyless(args: {
    url: string;
    method?: string;
}): Promise<string>;
export declare function auditEndpoint(args: {
    url: string;
}): Promise<string>;
/**
 * The same audit, run on a tools/list payload instead of a live endpoint. Works
 * for endpoints behind credentials, for a draft before it is deployed, and for
 * anything you can copy out of a client.
 */
export declare function auditTools(args: {
    tools: string;
    label?: string;
}): Promise<string>;
export declare function compareServers(args: {
    a: string;
    b: string;
}): Promise<string>;
export declare function checkListing(args: {
    title?: string;
    seoTitle?: string;
    seoDescription?: string;
    description?: string;
    categories?: string[];
}): Promise<string>;
export declare function lintSource(args: {
    source: string;
    label?: string;
}): Promise<string>;
interface ParamSpec {
    name: string;
    type?: string;
    description: string;
    optional?: boolean;
}
interface ToolSpec {
    name: string;
    title: string;
    description: string;
    params?: ParamSpec[];
}
/**
 * Emits the complete server.ts registration block for a list of tools, in the
 * house style this repository uses. Every line it prints is final code: the only
 * thing it assumes is that api.ts exports one function per tool, named after the
 * tool in camelCase.
 */
export declare function generateToolRegistration(args: {
    serverName: string;
    tools: ToolSpec[];
}): Promise<string>;
/**
 * Compares two tools/list payloads and separates what breaks existing callers
 * from what is safe to ship.
 */
export declare function diffToolSchema(args: {
    before: string;
    after: string;
}): Promise<string>;
/**
 * Searches the official MCP registry, which is the list a client sees when it
 * looks a server up by name. Answers the question a builder actually has before
 * a first release: is this name already taken, and what do the neighbours look
 * like?
 */
export declare function registryLookup(args: {
    query: string;
    limit?: number;
}): Promise<string>;
/**
 * Audits an npm package the way the registry expects it to look: does it exist,
 * is it current, and does the manifest carry what a registry submission needs
 * (mcpName, a runnable bin, keywords, a licence).
 */
export declare function npmPackageCheck(args: {
    name: string;
}): Promise<string>;
/**
 * Actually calls one tool on a public MCP endpoint. audit_endpoint says whether
 * a server introduces itself properly; this says whether a tool answers, how
 * fast, and in what shape — the check a builder runs before shipping.
 */
export declare function callTool(args: {
    url: string;
    tool: string;
    args?: string;
}): Promise<string>;
/**
 * Checks a server.json against the rules the official registry enforces, so a
 * submission is fixed before it is sent rather than bounced after.
 */
export declare function serverJsonCheck(args: {
    serverJson: string;
}): Promise<string>;
export {};
