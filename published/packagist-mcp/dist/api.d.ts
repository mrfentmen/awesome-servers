export declare class PackagistError extends Error {
}
export declare function cleanName(name: string): string;
export declare function searchPackages(query: string, limit: number): Promise<string>;
export declare function packageInfo(name: string): Promise<string>;
export declare function popularPackages(limit: number): Promise<string>;
export declare function packageVersions(name: string, limit: number): Promise<string>;
export declare function packageDependencies(name: string): Promise<string>;
export declare function registryTotals(): Promise<string>;
export declare function comparePackages(a: string, b: string): Promise<string>;
