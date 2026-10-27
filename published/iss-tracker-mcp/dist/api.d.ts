export declare class IssError extends Error {
}
export declare function currentPosition(id?: number): Promise<string>;
export declare function positionTrack(id?: number, minutes?: number, points?: number): Promise<string>;
export declare function visibilityReport(id?: number, hours?: number, points?: number): Promise<string>;
export declare function listSatellites(): Promise<string>;
export declare function satelliteTle(id?: number): Promise<string>;
export declare function overheadCheck(id?: number, latitude?: number, longitude?: number): Promise<string>;
