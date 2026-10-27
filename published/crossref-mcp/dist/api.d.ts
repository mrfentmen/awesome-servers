export declare class CrossrefError extends Error {
}
export declare function searchWorks(query: string, rows?: number): Promise<string>;
export declare function workByDoi(doi: string): Promise<string>;
export declare function journalInfo(issn: string): Promise<string>;
export declare function recentWorks(query?: string, days?: number, rows?: number): Promise<string>;
export declare function worksByAuthor(author: string, rows?: number): Promise<string>;
export declare function funderSearch(query: string, rows?: number): Promise<string>;
