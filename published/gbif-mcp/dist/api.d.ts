export declare class GbifError extends Error {
}
export declare function match(name: string): Promise<any>;
export declare function species(key: string): Promise<any>;
export declare function occurrences(params: Record<string, string>): Promise<any>;
export declare function format(data: any): string;
export declare function speciesSearch(q: string, limit?: number): Promise<any>;
export declare function occurrenceCount(taxonKey: string): Promise<any>;
export declare function countries(): Promise<any>;
export declare function organizations(limit?: number): Promise<any>;
export declare function installations(limit?: number): Promise<any>;
export declare function nodes(limit?: number): Promise<any>;
export declare function dataset(key: string): Promise<any>;
