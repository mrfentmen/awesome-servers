export declare class CourtListenerError extends Error {
}
export interface OpinionHit {
    caseName?: string;
    court?: string;
    dateFiled?: string;
    status?: string;
    citation?: string;
    citeCount?: number;
    judge?: string;
    syllabus?: string;
    url?: string;
}
export declare function searchOpinions(query: string, limit?: number): Promise<OpinionHit[]>;
export interface DocketHit {
    caseName?: string;
    court?: string;
    docketNumber?: string;
    dateFiled?: string;
    url?: string;
}
export declare function searchDockets(query: string, limit?: number): Promise<DocketHit[]>;
export declare function formatOpinion(o: OpinionHit, index?: number): string;
export declare function formatDocket(d: DocketHit, index?: number): string;
export interface PersonHit {
    name?: string;
    court?: string;
    dateFiled?: string;
    url?: string;
}
export declare function searchPeople(query: string, limit?: number): Promise<PersonHit[]>;
export declare function formatPerson(p: PersonHit, index?: number): string;
export interface OralArgHit {
    caseName?: string;
    court?: string;
    dateArgued?: string;
    duration?: string;
    url?: string;
}
export declare function searchOralArgs(query: string, limit?: number): Promise<OralArgHit[]>;
export declare function formatOralArg(o: OralArgHit, index?: number): string;
