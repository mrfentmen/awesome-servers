export declare class BbsError extends Error {
}
export interface BbsEntry {
    name: string;
    telnet: string[];
    ssh?: string[];
    software?: string;
    connection?: string[];
    location?: string;
    url: string;
}
export declare function parseListing(html: string): BbsEntry[];
export declare function listAll(): Promise<BbsEntry[]>;
export declare function formatBbs(b: BbsEntry, index?: number): string;
