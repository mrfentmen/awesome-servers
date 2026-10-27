export declare class LobstersError extends Error {
}
export declare function hottest(limit: number): Promise<string>;
export declare function newest(limit: number): Promise<string>;
export declare function byTag(tag: string, limit: number): Promise<string>;
export declare function storyDetail(shortId: string): Promise<string>;
export declare function userInfo(username: string): Promise<string>;
export declare function domainBreakdown(limit: number): Promise<string>;
