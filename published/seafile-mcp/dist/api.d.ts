export declare class SeafileError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listLibraries(): Promise<string>;
export declare function getLibraryInfo(repoId: string): Promise<string>;
export declare function getDefaultLibrary(): Promise<string>;
export declare function getFileDetail(repoId: string, filePath: string): Promise<string>;
