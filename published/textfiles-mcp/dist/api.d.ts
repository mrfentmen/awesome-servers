export declare class TextfilesError extends Error {
}
export interface TfEntry {
    name: string;
    path: string;
    size?: string;
    isDir: boolean;
}
/** Parse a textfiles directory listing (site's own HTML table markup). */
export declare function parseListing(html: string): TfEntry[];
/** Extract topic sections from the directory page (directory.html). */
export declare function parseTopics(html: string): TfEntry[];
export declare function listTopics(): Promise<TfEntry[]>;
export declare function listDirectory(dir: string): Promise<TfEntry[]>;
export declare function readTextFile(path: string, maxChars?: number): Promise<string>;
export declare function formatEntry(e: TfEntry, index: number): string;
