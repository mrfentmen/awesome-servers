export declare class GbifError extends Error {
}
export declare function match(name: string): Promise<any>;
export declare function species(key: string): Promise<any>;
export declare function occurrences(params: Record<string, string>): Promise<any>;
export declare function format(data: any): string;
