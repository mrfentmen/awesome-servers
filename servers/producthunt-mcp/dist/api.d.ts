export declare class PhError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function viewer(): Promise<string>;
export declare function listPosts(limit?: string): Promise<string>;
/**
 * What the Show HN feed has launched lately and how each launch actually scored.
 * A product that cleared a thousand points here has been tried by a thousand
 * developers, which is a very different signal from a like count.
 */
export declare function showHnLaunches(args: {
    days?: number;
    minPoints?: number;
    limit?: number;
}): Promise<string>;
/**
 * The public GitHub footprint of a project: stars, forks, contributors, open
 * issues, licence and when it was last pushed. A launch page claims traction;
 * this is what the repository says.
 */
export declare function githubFootprint(args: {
    repo: string;
}): Promise<string>;
/**
 * Which open-source projects a topic or idea has produced, ranked by stars, so
 * the crowded end of a market can be seen before something is launched into it.
 */
export declare function competitiveScan(args: {
    query: string;
    limit?: number;
    language?: string;
}): Promise<string>;
