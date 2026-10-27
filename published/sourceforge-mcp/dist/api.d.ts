export declare class SourceForgeError extends Error {
}
export interface SfProject {
    shortname: string;
    name?: string;
    description?: string;
    url?: string;
}
export declare function getProject(shortname: string): Promise<SfProject>;
export declare function formatProject(p: SfProject): string;
