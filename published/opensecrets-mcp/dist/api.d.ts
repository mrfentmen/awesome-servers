export declare class OpenSecretsError extends Error {
}
export interface Candidate {
    id?: string;
    name?: string;
    party?: string;
    state?: string;
    chamber?: string;
}
export declare function searchCandidates(query: string, cycle?: string): Promise<Candidate[]>;
export declare function candidateSummary(cid: string, cycle?: string): Promise<string>;
export declare function formatCandidate(c: Candidate, index?: number): string;
export declare function fecCandidateSearch(args: {
    query: string;
    office?: string;
    state?: string;
    party?: string;
    limit?: number;
}): Promise<string>;
export declare function fecCommitteeSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;
