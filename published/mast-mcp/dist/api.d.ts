export declare class MastError extends Error {
}
export interface Observation {
    target?: string;
    collection?: string;
    instrument?: string;
    filters?: string;
    date?: string;
    id?: string;
}
export declare function coneSearch(ra: number, dec: number, radius?: number, limit?: number): Promise<Observation[]>;
export declare function formatObs(o: Observation, index?: number): string;
