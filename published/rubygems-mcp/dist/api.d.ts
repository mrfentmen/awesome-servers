export declare class RubyGemsError extends Error {
}
export declare function gemName(name: string): string;
export declare function searchGems(query: string, limit: number): Promise<string>;
export declare function gemInfo(name: string): Promise<string>;
export declare function gemVersions(name: string): Promise<string>;
export declare function latestReleases(limit: number): Promise<string>;
export declare function reverseDependencies(name: string, limit: number): Promise<string>;
export declare function gemOwners(name: string): Promise<string>;
