export declare class MetError extends Error {
}
export interface ArtObject {
    objectID: number;
    title?: string;
    artistDisplayName?: string;
    artistDisplayBio?: string;
    objectDate?: string;
    medium?: string;
    department?: string;
    culture?: string;
    classification?: string;
    primaryImage?: string;
    objectURL?: string;
    dimensions?: string;
    accessionYear?: string;
    isPublicDomain?: boolean;
}
export declare function searchObjects(query: string, limit?: number): Promise<ArtObject[]>;
export declare function getObject(id: number): Promise<ArtObject | null>;
export declare function getDepartments(): Promise<{
    departmentId: number;
    displayName: string;
}[]>;
export declare function formatObject(o: ArtObject): string;
