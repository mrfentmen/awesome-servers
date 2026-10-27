export declare class PypiError extends Error {
}
export interface PackageInfo {
    name: string;
    version: string;
    summary?: string;
    author?: string;
    license?: string;
    homePage?: string;
    requiresPython?: string;
    requiresDist: string[];
    releases: string[];
}
export declare function getPackage(name: string): Promise<PackageInfo>;
export interface ReleaseFile {
    filename: string;
    packagetype?: string;
    pythonVersion?: string;
    size?: number;
    url?: string;
}
export declare function getReleaseFiles(name: string, version: string): Promise<ReleaseFile[]>;
export declare function formatPackage(p: PackageInfo): string;
export declare function formatFiles(name: string, version: string, files: ReleaseFile[]): string;
export declare function versionDetails(name: string, version: string): Promise<PackageInfo>;
export declare function fileIndex(name: string): Promise<string[]>;
export declare function projectLinks(name: string): Promise<string>;
export declare function releaseHistory(name: string): Promise<string[]>;
