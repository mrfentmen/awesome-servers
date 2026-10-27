export declare class SpaceflightError extends Error {
}
export declare function latestNews(limit: number): Promise<string>;
export declare function searchNews(term: string, limit: number): Promise<string>;
export declare function newsBySite(site: string, limit: number): Promise<string>;
export declare function articleDetail(id: number): Promise<string>;
export declare function latestReports(limit: number): Promise<string>;
export declare function newsSources(): Promise<string>;
export declare function latestBlogs(limit: number): Promise<string>;
