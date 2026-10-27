export declare class ReactomeError extends Error {
}
export interface PathwayHit {
    stId: string;
    name: string;
    type?: string;
    species: string[];
    summary?: string;
}
export declare function searchPathways(query: string, limit?: number): Promise<PathwayHit[]>;
export interface PathwayDetails {
    stId: string;
    name?: string;
    species?: string;
    summary?: string;
    compartments: string[];
    literature: string[];
}
export declare function getPathway(stId: string): Promise<PathwayDetails | null>;
export declare function formatHit(h: PathwayHit, index?: number): string;
export declare function formatPathway(p: PathwayDetails): string;
export interface PathwayStructureArgs {
    stId: string;
}
export declare function pathway_structure(args: PathwayStructureArgs): Promise<string>;
export interface PathwayParticipantsArgs {
    stId: string;
    limit?: number;
}
export interface PathwayTreeArgs {
    stId: string;
    maxDepth?: number;
}
export interface IdentifierPathwayArgs {
    resource: string;
    identifier: string;
    limit?: number;
}
