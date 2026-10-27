export declare class MavenError extends Error {
}
export declare function coords(groupId: string, artifactId: string): {
    g: string;
    a: string;
};
export declare function searchArtifacts(query: string, limit: number): Promise<string>;
export declare function artifactVersions(groupId: string, artifactId: string, limit: number): Promise<string>;
export declare function latestVersion(groupId: string, artifactId: string): Promise<string>;
export declare function groupArtifacts(groupId: string, limit: number): Promise<string>;
export declare function searchByClass(className: string, limit: number): Promise<string>;
export declare function dependencySnippet(groupId: string, artifactId: string, version?: string): Promise<string>;
