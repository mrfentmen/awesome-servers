export declare class HexError extends Error {
}
export interface HexPackage {
    name: string;
    description?: string;
    latest?: string;
    downloads?: number;
    docs?: string;
    repo?: string;
    licenses: string[];
    releases: string[];
}
export declare function getPackage(name: string): Promise<HexPackage>;
export interface HexRelease {
    version: string;
    published?: string;
    checksum?: string;
    requirements: string[];
}
export declare function getRelease(name: string, version: string): Promise<HexRelease>;
export declare function formatPackage(p: HexPackage): string;
export declare function formatRelease(name: string, r: HexRelease): string;
export interface SearchPackagesArgs {
    query: string;
    sort?: string;
    limit?: number;
}
export declare function packageOwners(args: {
    name: string;
    limit?: number;
}): Promise<string>;
