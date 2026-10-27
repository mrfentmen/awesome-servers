export declare class KnmiError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listDatasets(): Promise<string>;
export declare function listVersions(dataset: string): Promise<string>;
export declare function listFiles(dataset: string, version: string, maxKeys?: number): Promise<string>;
export declare function getFile(dataset: string, version: string, filename: string): Promise<string>;
