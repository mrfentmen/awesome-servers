export declare class LogseqError extends Error {
}
type Raw = Record<string, any>;
export interface Page {
    name: string;
    id?: string | number;
}
export declare function listPages(): Promise<Page[]>;
export declare function getPage(name: string): Promise<Raw | null>;
export declare function pageBlocks(name: string, limit?: number): Promise<string[]>;
export declare function formatPage(name: string, page: Raw | null, blocks: string[]): string;
export {};
