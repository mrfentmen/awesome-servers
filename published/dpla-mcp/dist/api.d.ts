export declare class DplaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchItems(query: string, pageSize?: number): Promise<string>;
export declare function getItem(itemId: string): Promise<string>;
export declare function searchCollections(query: string): Promise<string>;
export declare function getCollection(collectionId: string): Promise<string>;
export declare function titleSearch(title: string, pageSize?: number): Promise<string>;
export declare function dateSearch(after: string, before: string, pageSize?: number): Promise<string>;
export declare function placeSearch(place: string, pageSize?: number): Promise<string>;
export declare function sortedSearch(query: string, sortBy: string, pageSize?: number): Promise<string>;
export declare function facetSearch(query: string, facet: string): Promise<string>;
