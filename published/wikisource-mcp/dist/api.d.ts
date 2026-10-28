export declare class WikisourceError extends Error {
}
export declare function searchTitles(query: string, limit?: number): Promise<unknown>;
export declare function extract(title: string, introOnly: boolean, limit: number): Promise<unknown>;
export declare function format(value: unknown): string;
