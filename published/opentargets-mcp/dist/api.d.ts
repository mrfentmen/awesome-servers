export declare class OpenTargetsError extends Error {
}
export interface SearchHit {
    id: string;
    kind: string;
    label: string;
}
export declare function searchEntities(query: string, entity: "target" | "disease" | "drug", limit?: number): Promise<SearchHit[]>;
export interface TargetDetails {
    id: string;
    symbol?: string;
    name?: string;
    biotype?: string;
    functions: string[];
    drugs: string[];
    diseases: string[];
}
export declare function getTarget(ensemblId: string): Promise<TargetDetails | null>;
export declare function formatHit(h: SearchHit, index?: number): string;
export declare function formatTarget(t: TargetDetails): string;
export interface DruggabilityArgs {
    ensemblId: string;
}
export interface PathwayArgs {
    ensemblId: string;
    limit?: number;
}
export interface EvidenceArgs {
    ensemblId: string;
    limit?: number;
}
export declare function target_evidence(args: EvidenceArgs): Promise<string>;
export interface DrugProfileArgs {
    chemblId?: string;
    limit?: number;
}
