export declare class ArchiveError extends Error {
}
export interface ArchiveItem {
    identifier: string;
    title?: string;
    mediatype?: string;
    year?: string;
    downloads?: number;
    collection?: string[];
    description?: string;
}
export interface ArchiveFile {
    name: string;
    size?: number;
    format?: string;
    length?: string;
    title?: string;
}
export declare function searchItems(query: string, mediatype: string | undefined, limit?: number): Promise<ArchiveItem[]>;
export declare function getItemDetails(identifier: string): Promise<{
    identifier: string;
    title?: string;
    mediatype?: string;
    description?: string;
    files: ArchiveFile[];
}>;
export declare function fmtSize(bytes?: number): string;
export declare function formatItem(it: ArchiveItem, index: number): string;
