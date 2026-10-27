export declare class AlphaFoldError extends Error {
}
export declare function getJson<T>(path: string): Promise<T>;
export interface Prediction {
    accession: string;
    modelId?: string;
    tool?: string;
    plddt?: number;
    lowConf?: number;
    veryLowConf?: number;
    created?: string;
    sequenceDate?: string;
}
export declare function getPrediction(accession: string): Promise<Prediction[]>;
export declare function modelFiles(accession: string, version?: string): {
    cif: string;
    pdb: string;
    pae: string;
    page: string;
};
export declare function formatPrediction(p: Prediction): string;
export interface ProteinIdentityArgs {
    accession: string;
}
export declare function proteinIdentity(args: ProteinIdentityArgs): Promise<string>;
export interface ConfidenceProfileArgs {
    accession: string;
}
export interface ModelVersionsArgs {
    accession: string;
}
export interface PaeSummaryArgs {
    accession: string;
    model?: number;
}
export declare function confidenceProfile(args: {
    accession: string;
}): Promise<string>;
export declare function modelVersions(args: {
    accession: string;
}): Promise<string>;
export declare function paeSummary(args: {
    accession: string;
    model?: number;
}): Promise<string>;
