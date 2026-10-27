export declare class ArxivError extends Error {
}
export declare function searchPapers(term: string, maxResults?: number, newestFirst?: boolean): Promise<string>;
export declare function paperById(id: string): Promise<string>;
export declare function papersByAuthor(author: string, maxResults?: number, newestFirst?: boolean): Promise<string>;
export declare function latestInCategory(category: string, maxResults?: number): Promise<string>;
export declare function searchInCategory(term: string, category: string, maxResults?: number): Promise<string>;
