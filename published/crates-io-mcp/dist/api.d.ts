export declare class CratesError extends Error {
}
export declare function crateName(name: string): string;
export declare function searchCrates(query: string, limit: number, sort: string): Promise<string>;
export declare function crateInfo(name: string): Promise<string>;
export declare function crateVersions(name: string, limit: number): Promise<string>;
export declare function crateOwners(name: string): Promise<string>;
export declare function crateDependencies(name: string, version?: string): Promise<string>;
export declare function downloadTrend(name: string): Promise<string>;
