export declare class FileRunError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function browseFolder(folderPath: string): Promise<string>;
export declare function searchFiles(folderPath: string, filename?: string, contents?: string): Promise<string>;
export declare function createFolder(folderPath: string, name: string): Promise<string>;
