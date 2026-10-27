export declare class HashnodeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function me(): Promise<string>;
export declare function publicationPosts(host: string, limit?: string): Promise<string>;
export declare function getUser(username: string): Promise<string>;
export declare function publicationInfo(host: string): Promise<string>;
export declare function postDetails(host: string, slug: string): Promise<string>;
export declare function seriesList(host: string, limit?: string): Promise<string>;
export declare function tagInfo(slug: string): Promise<string>;
export declare function userStats(username: string): Promise<string>;
export declare function userPublications(username: string): Promise<string>;
export declare function publicationMembers(host: string): Promise<string>;
/**
 * How an author's posts actually performed. The engagement counters live on the
 * user query, which Hashnode serves without a plan.
 */
export declare function authorEngagement(args: {
    username: string;
    limit?: number;
}): Promise<string>;
/** The social and professional footprint of a Hashnode account. */
export declare function userProfile(username: string): Promise<string>;
