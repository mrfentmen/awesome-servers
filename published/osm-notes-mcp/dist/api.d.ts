export declare class OsmNotesError extends Error {
}
export interface NoteComment {
    date?: string;
    uid?: number;
    user?: string;
    action?: string;
    text?: string;
}
export interface Note {
    id: number;
    lat: number;
    lon: number;
    status?: string;
    date_created?: string;
    comments?: NoteComment[];
}
export declare function notesInBbox(minLon: number, minLat: number, maxLon: number, maxLat: number, limit: number): Promise<Note[]>;
export declare function searchNotes(query: string, limit: number): Promise<Note[]>;
export declare function noteDetail(id: number): Promise<Note>;
export declare function radiusBbox(lat: number, lon: number, km: number): [number, number, number, number];
export declare function noteLine(n: Note): string;
export declare function noteDetailText(n: Note): string;
