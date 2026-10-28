export declare class TrialsError extends Error {
}
export declare function searchStudies(term: string, status: string | undefined, limit: number): Promise<string>;
export declare function studyDetail(nctId: string): Promise<string>;
export declare function recruitingByCondition(condition: string, limit: number): Promise<string>;
export declare function bySponsor(sponsor: string, limit: number): Promise<string>;
export declare function interventionSearch(intervention: string, status: string | undefined, limit: number): Promise<string>;
export declare function studyLocations(nctId: string): Promise<string>;
