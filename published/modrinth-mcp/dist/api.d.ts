/**
 * Modrinth API v2 client — the modern Minecraft mod host.
 * Docs: https://docs.modrinth.com/  (free, no key)
 */
export declare class ModrinthError extends Error {
}
export interface ProjectHit {
    projectId: string;
    slug: string;
    title: string;
    description: string;
    categories: string[];
    projectType: string;
    downloads: number;
    follows: number;
    author: string;
    license: {
        id: string;
        name: string;
    };
    versions: string[];
    iconUrl?: string;
    dateCreated: string;
    dateModified: string;
}
export interface Project {
    id: string;
    slug: string;
    title: string;
    description: string;
    body: string;
    categories: string[];
    projectType: string;
    downloads: number;
    followers: number;
    author: string;
    license: {
        id: string;
        name: string;
    };
    gameVersions: string[];
    loaders: string[];
    iconUrl?: string;
    sourceUrl?: string;
    issuesUrl?: string;
    url: string;
}
export interface Version {
    id: string;
    name: string;
    versionNumber: string;
    gameVersions: string[];
    loaders: string[];
    downloads: number;
    datePublished: string;
    files: {
        url: string;
        filename: string;
        size: number;
        primary?: boolean;
    }[];
    dependencies: {
        projectId?: string;
        versionId?: string;
        dependencyType?: string;
    }[];
}
export declare function searchProjects(query: string, projectType?: string, loader?: string, gameVersion?: string, limit?: number): Promise<ProjectHit[]>;
export declare function getProject(idOrSlug: string): Promise<Project | null>;
export declare function getProjectVersions(idOrSlug: string, loader?: string, gameVersion?: string, limit?: number): Promise<Version[]>;
export declare function fmtDownloads(n: number): string;
export declare function formatHit(h: ProjectHit, index: number): string;
export declare function formatProject(p: Project): string;
export declare function formatVersion(v: Version, index: number): string;
