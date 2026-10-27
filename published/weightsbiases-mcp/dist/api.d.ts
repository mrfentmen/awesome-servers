export declare class WandbError extends Error {
}
export interface Profile {
    username?: string;
    email?: string;
}
export declare function myProfile(): Promise<Profile>;
export interface Project {
    name: string;
    entity?: string;
}
export declare function listProjects(entity: string, limit?: number): Promise<Project[]>;
export interface Run {
    name?: string;
    state?: string;
    created?: string;
}
export declare function listRuns(entity: string, project: string, limit?: number): Promise<Run[]>;
/**
 * The public dataset index: what exists for a subject, how much it is used, and
 * what each entry declares about itself. A training run is only reproducible if
 * the dataset behind it can be named, and this is the place to look it up.
 */
export declare function datasetCatalogue(args: {
    query: string;
    limit?: number;
}): Promise<string>;
