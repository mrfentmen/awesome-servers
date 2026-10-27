export declare class NpmsError extends Error {
}
export interface ScoredPackage {
    name: string;
    version?: string;
    description?: string;
    final?: number;
    quality?: number;
    popularity?: number;
    maintenance?: number;
    links?: string;
}
export declare function searchPackages(query: string, limit?: number): Promise<ScoredPackage[]>;
export declare function getPackage(name: string): Promise<ScoredPackage>;
export declare function formatScored(p: ScoredPackage, index?: number): string;
