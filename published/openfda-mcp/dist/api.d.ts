export declare class OpenFdaError extends Error {
}
export declare function drugLabels(name: string, limit: number): Promise<string>;
export declare function adverseEvents(drug: string, limit: number): Promise<string>;
export declare function recalls(kind: "drug" | "device" | "food", term: string, limit: number): Promise<string>;
export declare function ndcLookup(name: string, limit: number): Promise<string>;
export declare function labelSections(name: string): Promise<string>;
